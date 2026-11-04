use crate::models::InstalledTrainerRecord;
use crate::services::{game_meta, scraper, storage};
use chrono::Local;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::time::timeout;
use super::matcher::{parse_game_info_from_filename, sanitize_folder_name};

/// 快速下载并落盘封面图片为 cover.jpg
pub async fn download_cover_image(cover_path: &Path, candidate_urls: &[&str]) -> bool {
    if cover_path.exists()
        && let Ok(meta) = fs::metadata(cover_path)
        && meta.len() > 1024
    {
        return true;
    }

    let client = match crate::services::config::get_shared_http_client() {
        Ok(c) => c,
        Err(_) => return false,
    };

    for &url in candidate_urls {
        if url.trim().is_empty() {
            continue;
        }
        let accelerated_url = crate::services::config::apply_steam_cdn_mirror(url);
        if let Ok(resp) = client.get(&accelerated_url).send().await
            && resp.status().is_success()
            && let Ok(bytes) = resp.bytes().await
            && bytes.len() > 1024
        {
            let _ = fs::write(cover_path, bytes);
            return true;
        }
    }

    false
}

/// 递归收集候选文件
pub fn collect_candidate_files(
    dir: &Path,
    depth: usize,
    max_depth: usize,
    include_zip: bool,
    results: &mut Vec<PathBuf>,
) {
    if depth > max_depth {
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    let matches = ext_lower == "exe" || (include_zip && ext_lower == "zip");
                    if matches {
                        // 大小检查：50KB ~ 500MB
                        if let Ok(m) = entry.metadata() {
                            let size = m.len();
                            if (50 * 1024..=500 * 1024 * 1024).contains(&size) {
                                results.push(path);
                            }
                        }
                    }
                }
            } else if path.is_dir() {
                let folder_name = path.file_name().unwrap_or_default().to_string_lossy();
                // 排除常见的非修改器系统文件夹
                if !folder_name.starts_with('.')
                    && folder_name != "node_modules"
                    && folder_name != "target"
                {
                    collect_candidate_files(&path, depth + 1, max_depth, include_zip, results);
                }
            }
        }
    }
}

/// 尝试从 ZIP 文件中提取第一个有效的可执行文件（使用独立临时目录避免并发冲突）
pub fn extract_single_exe_from_zip(zip_path: &Path) -> Option<PathBuf> {
    let file = fs::File::open(zip_path).ok()?;
    let mut archive = zip::ZipArchive::new(file).ok()?;

    let mut target_index = None;
    for i in 0..archive.len() {
        if let Ok(f) = archive.by_index(i)
            && f.name().to_lowercase().ends_with(".exe")
            && !f.name().to_lowercase().contains("setup")
        {
            target_index = Some(i);
            break;
        }
    }

    let idx = target_index?;
    let mut exe_file = archive.by_index(idx).ok()?;

    static COUNTER: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(1);
    let seq = COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
    let pid = std::process::id();
    let now_nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let temp_dir =
        std::env::temp_dir().join(format!("fling_import_tmp_{}_{}_{}", pid, now_nanos, seq));
    let _ = fs::create_dir_all(&temp_dir);

    let sanitized_name = Path::new(exe_file.name())
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let temp_exe = temp_dir.join(sanitized_name);

    let mut out = fs::File::create(&temp_exe).ok()?;
    std::io::copy(&mut exe_file, &mut out).ok()?;

    Some(temp_exe)
}

/// 核心数据匹配与收纳：通过 SQLite 与风灵月影官网全量获取选项、热键看板、封面及 Steam 原画
pub async fn process_and_import_single_file(
    file_path: PathBuf,
    trainers_root: &Path,
    existing_records: &[InstalledTrainerRecord],
) -> Result<Option<String>, String> {
    let file_name = file_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let lower_name = file_name.to_lowercase();
    if lower_name.starts_with("unins")
        || lower_name.contains("setup")
        || lower_name.contains("dxwebsetup")
        || lower_name.contains("vc_redist")
        || lower_name.contains("unitycrashhandler")
    {
        return Ok(None);
    }

    // 处理 .exe 或 .zip
    let is_extracted_zip = lower_name.ends_with(".zip");
    let target_exe: Option<PathBuf> = if lower_name.ends_with(".exe") {
        Some(file_path.clone())
    } else if is_extracted_zip {
        extract_single_exe_from_zip(&file_path)
    } else {
        None
    };

    let exe_to_import = match target_exe {
        Some(p) => p,
        None => return Ok(None),
    };

    // 1. 启发式提取游戏纯净名与版本号
    let (raw_game_name, version) = parse_game_info_from_filename(&file_name);

    // 2. 本地 SQLite 极速匹配 (0.1ms 查出中文名与官网 slug)
    let local_info = game_meta::query_local_game_and_trainer_info(&raw_game_name);
    let raw_slug = local_info
        .as_ref()
        .and_then(|info| info.slug.clone())
        .unwrap_or_else(|| game_meta::guess_slug_from_name(&raw_game_name));

    let local_chinese = local_info
        .as_ref()
        .and_then(|info| info.chinese_name.clone());

    // 3. 异步获取风灵月影官方详情数据
    let trainer_detail = match timeout(
        Duration::from_millis(4500),
        scraper::get_trainer_detail(&raw_slug),
    )
    .await
    {
        Ok(Ok(detail)) => Some(detail),
        _ => None,
    };

    let display_name = trainer_detail
        .as_ref()
        .and_then(|d| d.chinese_name.clone())
        .or(local_chinese.clone())
        .unwrap_or_else(|| raw_game_name.clone());

    // 4. 规范化目标子目录名称
    let mut safe_folder_name = sanitize_folder_name(&display_name);
    let mut game_install_dir = trainers_root.join(&safe_folder_name);

    if game_install_dir.exists() {
        let existing_json = game_install_dir.join("trainer.json");
        if existing_json.exists()
            && let Ok(content) = fs::read_to_string(&existing_json)
            && let Ok(rec) = serde_json::from_str::<InstalledTrainerRecord>(&content)
            && rec.name != raw_game_name
            && rec.chinese_name.as_deref() != Some(&display_name)
        {
            let disambiguated = format!("{}_{}", safe_folder_name, raw_slug);
            safe_folder_name = sanitize_folder_name(&disambiguated);
            game_install_dir = trainers_root.join(&safe_folder_name);
        }
    }

    if !game_install_dir.exists() {
        let _ = fs::create_dir_all(&game_install_dir);
    }

    // 拷贝 exe 到专属子目录中
    let final_exe_name = exe_to_import
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let target_exe_path = game_install_dir.join(&final_exe_name);

    if exe_to_import != target_exe_path
        && let Err(e) = fs::copy(&exe_to_import, &target_exe_path)
    {
        eprintln!("复制修改器可执行程序失败: {}", e);
        if is_extracted_zip && let Some(parent) = exe_to_import.parent() {
            let _ = fs::remove_dir_all(parent);
        }
        return Ok(None);
    }

    if is_extracted_zip && let Some(parent) = exe_to_import.parent() {
        let _ = fs::remove_dir_all(parent);
    }

    // 5. 抓取并缓存 cover.jpg 封面到本地目录
    let cover_file = game_install_dir.join("cover.jpg");
    let mut candidate_images: Vec<&str> = Vec::new();

    if let Some(ref d) = trainer_detail {
        if let Some(ref c) = d.capsule_image {
            candidate_images.push(c);
        }
        if !d.thumbnail.is_empty() {
            candidate_images.push(&d.thumbnail);
        }
    }

    download_cover_image(&cover_file, &candidate_images).await;

    let local_capsule = if cover_file.exists() {
        Some(cover_file.to_string_lossy().to_string())
    } else {
        trainer_detail
            .as_ref()
            .and_then(|d| d.capsule_image.clone())
    };

    // 6. 继承或生成 trainer.json
    let existing = existing_records.iter().find(|r| {
        r.id == safe_folder_name
            || r.chinese_name.as_deref() == Some(&display_name)
            || r.name == raw_game_name
    });

    let saved_toggles = existing
        .map(|e| e.saved_toggles.clone())
        .unwrap_or_default();
    let last_launched_at = existing.and_then(|e| e.last_launched_at.clone());

    let (options, option_items, description, game_version, steam_app_id, hero_image, thumbnail) =
        if let Some(detail) = trainer_detail {
            (
                detail.options,
                detail.option_items,
                if detail.description.trim().is_empty() {
                    "通过外部批量扫描自动识别并收纳建档的修改器".to_string()
                } else {
                    detail.description
                },
                detail.game_version,
                detail.steam_app_id,
                detail.hero_image,
                detail.thumbnail,
            )
        } else {
            (
                Vec::new(),
                Vec::new(),
                "通过外部批量扫描自动识别并收纳建档的修改器".to_string(),
                "".to_string(),
                None,
                None,
                "".to_string(),
            )
        };

    let record = InstalledTrainerRecord {
        id: safe_folder_name.clone(),
        name: raw_game_name.clone(),
        chinese_name: Some(display_name.clone()),
        version: version.clone(),
        game_version,
        exe_path: target_exe_path.to_string_lossy().to_string(),
        exe_name: final_exe_name,
        install_dir: game_install_dir.to_string_lossy().to_string(),
        installed_at: Local::now().to_rfc3339(),
        last_launched_at,
        steam_app_id,
        thumbnail,
        hero_image,
        capsule_image: local_capsule,
        description,
        options,
        option_items,
        saved_toggles,
    };

    let _ = storage::save_installed_record(record);
    Ok(Some(display_name))
}
