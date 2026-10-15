use crate::models::InstalledTrainerRecord;
use crate::services::{game_meta, storage};
use chrono::Local;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

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

/// 扫描指定外部文件夹，批量识别、匹配并收归入 trainers/ 目录
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
    let mut imported_names = Vec::new();
    let mut skipped_count = 0usize;

    let existing_records = storage::load_installed_records();

    for file_path in candidate_files {
        // 如果文件已经在目标 trainers_root 下，直接跳过避免重复导入
        if file_path.starts_with(&trainers_root) {
            skipped_count += 1;
            continue;
        }

        let file_name = file_path.file_name().unwrap_or_default().to_string_lossy().to_string();

        // 排除常见的非修改器文件
        let lower_name = file_name.to_lowercase();
        if lower_name.starts_with("unins")
            || lower_name.contains("setup")
            || lower_name.contains("dxwebsetup")
            || lower_name.contains("vc_redist")
            || lower_name.contains("unitycrashhandler")
        {
            skipped_count += 1;
            continue;
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
            None => {
                skipped_count += 1;
                continue;
            }
        };

        // 提取游戏名称与版本号
        let (raw_game_name, version) = parse_game_info_from_filename(&file_name);

        // 调用 Steam / 本地 SQLite 增强元数据
        let meta = game_meta::resolve_meta_for_name(&raw_game_name).await;

        let display_name = meta
            .chinese_name
            .clone()
            .unwrap_or_else(|| raw_game_name.clone());

        // 规范化目标子目录名称（清洗 Windows 非法字符）
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
                skipped_count += 1;
                continue;
            }
        }

        // 保存 cover.jpg 封面到本地目录
        let cover_file = game_install_dir.join("cover.jpg");
        if !cover_file.exists() {
            if let Some(ref img_url) = meta.capsule_image {
                if let Ok(resp) = reqwest::get(img_url).await {
                    if resp.status().is_success() {
                        if let Ok(bytes) = resp.bytes().await {
                            let _ = fs::write(&cover_file, bytes);
                        }
                    }
                }
            }
        }

        let local_capsule = if cover_file.exists() {
            Some(cover_file.to_string_lossy().to_string())
        } else {
            meta.capsule_image.clone()
        };

        // 生成或继承 trainer.json
        let existing = existing_records.iter().find(|r| {
            r.chinese_name.as_deref() == Some(&display_name) || r.name == raw_game_name
        });

        let saved_toggles = existing.map(|e| e.saved_toggles.clone()).unwrap_or_default();
        let last_launched_at = existing.and_then(|e| e.last_launched_at.clone());

        let record = InstalledTrainerRecord {
            id: safe_folder_name.clone(),
            name: raw_game_name.clone(),
            chinese_name: meta.chinese_name.clone().or_else(|| Some(display_name.clone())),
            version: version.clone(),
            game_version: "".to_string(),
            exe_path: target_exe_path.to_string_lossy().to_string(),
            exe_name: final_exe_name,
            install_dir: game_install_dir.to_string_lossy().to_string(),
            installed_at: Local::now().to_rfc3339(),
            last_launched_at,
            steam_app_id: meta.steam_app_id,
            thumbnail: "".to_string(),
            hero_image: meta.hero_image.clone(),
            capsule_image: local_capsule,
            description: "通过外部批量扫描自动识别并收纳建档的修改器".to_string(),
            options: Vec::new(),
            option_items: Vec::new(),
            saved_toggles,
        };

        let _ = storage::save_installed_record(record);
        imported_names.push(display_name);
    }

    Ok(ImportSummary {
        total_scanned,
        imported_count: imported_names.len(),
        imported_names,
        skipped_count,
    })
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
