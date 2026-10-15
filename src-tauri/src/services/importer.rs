use crate::models::InstalledTrainerRecord;
use crate::services::{game_meta, scraper, storage};
use chrono::Local;
use futures_util::stream::{self, StreamExt};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::time::timeout;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSummary {
    pub total_scanned: usize,
    pub imported_count: usize,
    pub imported_names: Vec<String>,
    pub skipped_count: usize,
}

/// 调起 Windows 原生系统文件夹选择对话框
pub fn pick_folder_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("powershell")
            .args([
                "-STA",
                "-NoProfile",
                "-Command",
                "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = '请选择包含修改器的外部文件夹'; $f.ShowNewFolderButton = $false; $dummy = New-Object System.Windows.Forms.Form; $dummy.TopMost = $true; if($f.ShowDialog($dummy) -eq [System.Windows.Forms.DialogResult]::OK){ Write-Output $f.SelectedPath }",
            ])
            .output()
            .map_err(|e| format!("打开系统文件夹选择器失败: {}", e))?;

        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() {
            Ok(None)
        } else {
            Ok(Some(path))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}

/// 从修改器文件名中启发式提取游戏名称与版本号
pub fn parse_game_info_from_filename(filename: &str) -> (String, String) {
    let name_without_ext = Path::new(filename)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| filename.to_string());

    // 1. 去除常见的发布组/来源前缀与后缀
    let mut cleaned = name_without_ext;
    let noisy_tags = [
        "[FLiNG]", "(FLiNG)", "-FLiNG", "_FLiNG", "FLiNG",
        "[3DM]", "(3DM)", "-3DM", "_3DM", "3DM",
        "[游侠]", "(游侠)", "游侠",
        "Trainer", "trainer", "TRAINER",
        "Cheats", "cheats", "Cheat", "cheat",
        "修改器",
    ];

    // 2. 正则提取版本号 (如 v1.0, v1.12, v1.0-v1.3+, 2024.08.20 等)
    let ver_regex = Regex::new(r"(?i)\b(v\d+(\.\d+)*(\-v\d+(\.\d+)*\+?)?|\d{4}\.\d{2}\.\d{2})\b").unwrap();
    let version = if let Some(caps) = ver_regex.find(&cleaned) {
        caps.as_str().to_string()
    } else {
        "v1.0+".to_string()
    };

    // 剔除 Plus 选项数量 (如 Plus 17, Plus 34)
    let plus_regex = Regex::new(r"(?i)\bplus\s*\d+\b").unwrap();
    cleaned = plus_regex.replace_all(&cleaned, " ").to_string();

    // 剔除版本号字符串
    cleaned = ver_regex.replace_all(&cleaned, " ").to_string();

    // 替换点号、下划线、连字符为单个空格
    cleaned = cleaned.replace(['.', '_', '-'], " ");

    for tag in noisy_tags {
        cleaned = cleaned.replace(tag, " ");
    }

    // 过滤连续多余空格
    let game_name: String = cleaned
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
        .trim()
        .to_string();

    let final_name = if game_name.is_empty() {
        Path::new(filename)
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "未知游戏修改器".to_string())
    } else {
        game_name
    };

    (final_name, version)
}

/// 快速下载并落盘封面图片为 cover.jpg
async fn download_cover_image(cover_path: &Path, candidate_urls: &[&str]) -> bool {
    if cover_path.exists() {
        if let Ok(meta) = fs::metadata(cover_path) {
            if meta.len() > 1024 {
                return true;
            }
        }
    }

    let client = match reqwest::Client::builder()
        .timeout(Duration::from_millis(3000))
        .user_agent("Mozilla/5.0")
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };

    for &url in candidate_urls {
        if url.trim().is_empty() {
            continue;
        }
        if let Ok(resp) = client.get(url).send().await {
            if resp.status().is_success() {
                if let Ok(bytes) = resp.bytes().await {
                    if bytes.len() > 1024 {
                        let _ = fs::write(cover_path, bytes);
                        return true;
                    }
                }
            }
        }
    }

    false
}

/// 核心数据匹配与收纳：通过 SQLite 与风灵月影官网全量获取选项、热键看板、封面及 Steam 原画
async fn process_and_import_single_file(
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
    let target_exe: Option<PathBuf> = if lower_name.ends_with(".exe") {
        Some(file_path.clone())
    } else if lower_name.ends_with(".zip") {
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

    // 3. 异步获取风灵月影官方详情数据（含全部功能项、热键、说明、官网高清海报）
    let trainer_detail = match timeout(Duration::from_millis(4500), scraper::get_trainer_detail(&raw_slug)).await {
        Ok(Ok(detail)) => Some(detail),
        _ => None,
    };

    let display_name = trainer_detail
        .as_ref()
        .and_then(|d| d.chinese_name.clone())
        .or(local_chinese.clone())
        .unwrap_or_else(|| raw_game_name.clone());

    // 4. 规范化目标子目录名称（清洗 Windows 非法字符）
    let safe_folder_name = sanitize_folder_name(&display_name);
    let game_install_dir = trainers_root.join(&safe_folder_name);

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

    if exe_to_import != target_exe_path {
        if let Err(e) = fs::copy(&exe_to_import, &target_exe_path) {
            eprintln!("复制修改器可执行程序失败: {}", e);
            return Ok(None);
        }
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
        trainer_detail.as_ref().and_then(|d| d.capsule_image.clone())
    };

    // 6. 继承或生成 trainer.json
    let existing = existing_records.iter().find(|r| {
        r.id == safe_folder_name || r.chinese_name.as_deref() == Some(&display_name) || r.name == raw_game_name
    });

    let saved_toggles = existing.map(|e| e.saved_toggles.clone()).unwrap_or_default();
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

/// 扫描指定外部文件夹，批量识别、匹配并收归入 trainers/ 目录 (并行加速)
pub async fn scan_and_import_trainers(folder_path: &str) -> Result<ImportSummary, String> {
    let source_dir = PathBuf::from(folder_path);
    if !source_dir.exists() || !source_dir.is_dir() {
        return Err(format!("指定扫描目录不存在或不是有效文件夹: {}", folder_path));
    }

    let trainers_root = storage::get_trainers_dir();

    // 递归查找候选文件 (最大深度为 3 层)
    let mut candidate_files = Vec::new();
    collect_candidate_files(&source_dir, 0, 3, &mut candidate_files);

    let total_scanned = candidate_files.len();
    let existing_records = storage::load_installed_records();

    // 并行流式处理 (限制并发度为 4，兼顾性能与网络稳定)
    let trainers_root_ref = &trainers_root;
    let existing_records_ref = &existing_records;

    let results = stream::iter(candidate_files)
        .map(|file_path| async move {
            // 如果文件已经在目标 trainers_root 下，直接跳过避免重复导入
            if file_path.starts_with(trainers_root_ref) {
                return Ok(None);
            }
            process_and_import_single_file(file_path, trainers_root_ref, existing_records_ref).await
        })
        .buffer_unordered(4)
        .collect::<Vec<Result<Option<String>, String>>>()
        .await;

    let mut imported_names = Vec::new();
    let mut skipped_count = 0usize;

    for res in results {
        match res {
            Ok(Some(name)) => imported_names.push(name),
            _ => skipped_count += 1,
        }
    }

    Ok(ImportSummary {
        total_scanned,
        imported_count: imported_names.len(),
        imported_names,
        skipped_count,
    })
}

/// 对指定已安装的修改器进行全面数据补齐与同步（从风灵月影官网抓取选项、热键看板及高清封面）
pub async fn enrich_installed_trainer(id: &str) -> Result<InstalledTrainerRecord, String> {
    let records = storage::load_installed_records();
    let mut target = records
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("未找到指定的修改器记录: {}", id))?;

    let trainers_root = storage::get_trainers_dir();
    let game_install_dir = trainers_root.join(&target.id);

    // 1. 本地 SQLite 查询英文名或中文名对应的官网 slug
    let query_name = target.name.clone();
    let local_info = game_meta::query_local_game_and_trainer_info(&query_name)
        .or_else(|| target.chinese_name.as_deref().and_then(game_meta::query_local_game_and_trainer_info));

    let slug = local_info
        .as_ref()
        .and_then(|info| info.slug.clone())
        .unwrap_or_else(|| game_meta::guess_slug_from_name(&query_name));

    // 2. 抓取官网详情 (超时限制 5 秒)
    let detail_opt = match timeout(Duration::from_millis(5000), scraper::get_trainer_detail(&slug)).await {
        Ok(Ok(detail)) => Some(detail),
        _ => None,
    };

    if let Some(detail) = detail_opt {
        target.options = detail.options;
        target.option_items = detail.option_items;
        if !detail.description.trim().is_empty() {
            target.description = detail.description;
        }
        if !detail.game_version.trim().is_empty() {
            target.game_version = detail.game_version;
        }
        if !detail.thumbnail.is_empty() {
            target.thumbnail = detail.thumbnail.clone();
        }
        if detail.steam_app_id.is_some() {
            target.steam_app_id = detail.steam_app_id;
        }
        if detail.hero_image.is_some() {
            target.hero_image = detail.hero_image;
        }
        if target.chinese_name.is_none() || target.chinese_name.as_deref() == Some(&target.name) {
            if let Some(cn) = detail.chinese_name {
                target.chinese_name = Some(cn);
            }
        }

        // 3. 补全封面落盘 cover.jpg
        let cover_file = game_install_dir.join("cover.jpg");
        let mut candidate_images = Vec::new();
        if let Some(ref c) = detail.capsule_image {
            candidate_images.push(c.as_str());
        }
        if !detail.thumbnail.is_empty() {
            candidate_images.push(detail.thumbnail.as_str());
        }

        download_cover_image(&cover_file, &candidate_images).await;

        if cover_file.exists() {
            target.capsule_image = Some(cover_file.to_string_lossy().to_string());
        } else if target.capsule_image.is_none() {
            target.capsule_image = detail.capsule_image;
        }
    } else {
        // 若联网详情未匹配到，尝试补齐中文名与 Steam 胶囊
        let meta = game_meta::resolve_meta_for_name(&target.name).await;
        if target.chinese_name.is_none() || target.chinese_name.as_deref() == Some(&target.name) {
            target.chinese_name = meta.chinese_name;
        }
        if target.steam_app_id.is_none() {
            target.steam_app_id = meta.steam_app_id;
        }
        if target.hero_image.is_none() {
            target.hero_image = meta.hero_image;
        }
        if target.capsule_image.is_none() {
            let cover_file = game_install_dir.join("cover.jpg");
            if let Some(ref img) = meta.capsule_image {
                download_cover_image(&cover_file, &[img]).await;
            }
            if cover_file.exists() {
                target.capsule_image = Some(cover_file.to_string_lossy().to_string());
            } else {
                target.capsule_image = meta.capsule_image;
            }
        }
    }

    // 保存回 trainer.json
    storage::save_installed_record(target.clone())?;
    Ok(target)
}

/// 一键并发补全所有缺失选项、热键看板或封面数据的修改器
pub async fn enrich_all_installed_trainers() -> Result<usize, String> {
    let records = storage::load_installed_records();
    let need_enrich: Vec<String> = records
        .into_iter()
        .filter(|r| r.option_items.is_empty() || r.options.is_empty() || r.capsule_image.is_none())
        .map(|r| r.id)
        .collect();

    if need_enrich.is_empty() {
        return Ok(0);
    }

    let count = need_enrich.len();
    let _results = stream::iter(need_enrich)
        .map(|id| async move {
            let _ = enrich_installed_trainer(&id).await;
        })
        .buffer_unordered(4)
        .collect::<Vec<()>>()
        .await;

    Ok(count)
}

/// 递归收集候选文件
fn collect_candidate_files(dir: &Path, depth: usize, max_depth: usize, results: &mut Vec<PathBuf>) {
    if depth > max_depth {
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if ext_lower == "exe" || ext_lower == "zip" {
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
                if !folder_name.starts_with('.') && folder_name != "node_modules" && folder_name != "target" {
                    collect_candidate_files(&path, depth + 1, max_depth, results);
                }
            }
        }
    }
}

/// 尝试从 ZIP 文件中提取第一个有效的可执行文件
fn extract_single_exe_from_zip(zip_path: &Path) -> Option<PathBuf> {
    let file = fs::File::open(zip_path).ok()?;
    let mut archive = zip::ZipArchive::new(file).ok()?;

    let mut target_index = None;
    for i in 0..archive.len() {
        if let Ok(f) = archive.by_index(i) {
            if f.name().to_lowercase().ends_with(".exe") && !f.name().to_lowercase().contains("setup") {
                target_index = Some(i);
                break;
            }
        }
    }

    let idx = target_index?;
    let mut exe_file = archive.by_index(idx).ok()?;
    let temp_dir = std::env::temp_dir().join("fling_import_tmp");
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

fn sanitize_folder_name(name: &str) -> String {
    let invalid = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let sanitized: String = name
        .chars()
        .map(|c| if invalid.contains(&c) { ' ' } else { c })
        .collect();

    let trimmed = sanitized.trim().trim_matches('.').trim();
    if trimmed.is_empty() {
        "Unknown_Game".to_string()
    } else {
        trimmed.split_whitespace().collect::<Vec<&str>>().join(" ")
    }
}
