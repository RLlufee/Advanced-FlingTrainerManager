use crate::models::InstalledTrainerRecord;
use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;

/// 剥离 Windows 下 canonicalize 产生的 \\?\ 或 \\?\UNC\ 扩展长路径前缀
pub fn strip_verbatim_prefix(path: &std::path::Path) -> PathBuf {
    let s = path.to_string_lossy();
    if let Some(rest) = s.strip_prefix(r"\\?\UNC\") {
        PathBuf::from(format!(r"\\{}", rest))
    } else if let Some(rest) = s.strip_prefix(r"\\?\") {
        PathBuf::from(rest)
    } else {
        path.to_path_buf()
    }
}

pub fn get_app_data_dir() -> PathBuf {
    if let Some(proj_dirs) = ProjectDirs::from("com", "flingtrainer", "manager") {
        let path = proj_dirs.data_local_dir().to_path_buf();
        let _ = fs::create_dir_all(&path);
        path
    } else {
        let fallback = PathBuf::from("./.data");
        let _ = fs::create_dir_all(&fallback);
        fallback
    }
}

/// 获取与主程序同级的 trainers 便携式目录，或用户在设置中自定义的存储路径
pub fn get_trainers_dir() -> PathBuf {
    let config_file = get_app_data_dir().join("app_config.json");
    if config_file.exists() {
        if let Ok(content) = fs::read_to_string(&config_file) {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(custom) = v.get("management").and_then(|m| m.get("custom_trainers_dir")).and_then(|c| c.as_str()) {
                    let trimmed = custom.trim();
                    if !trimmed.is_empty() {
                        let path = PathBuf::from(trimmed);
                        let _ = fs::create_dir_all(&path);
                        return path;
                    }
                }
            }
        }
    }

    let base_dir = if let Ok(cwd) = std::env::current_dir() {
        if cwd.join("src-tauri").exists() || cwd.join("package.json").exists() {
            cwd
        } else if let Ok(exe) = std::env::current_exe() {
            exe.parent().unwrap_or(&cwd).to_path_buf()
        } else {
            cwd
        }
    } else if let Ok(exe) = std::env::current_exe() {
        exe.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| PathBuf::from("."))
    } else {
        PathBuf::from(".")
    };

    let dir = base_dir.join("trainers");
    let _ = fs::create_dir_all(&dir);
    dir
}

/// 兼容旧方法
pub fn get_download_dir() -> PathBuf {
    get_trainers_dir()
}

/// 扫描 trainers 目录下的所有子文件夹，读取每个修改器的 trainer.json
pub fn load_installed_records() -> Vec<InstalledTrainerRecord> {
    let trainers_dir = get_trainers_dir();
    let mut records = Vec::new();

    if let Ok(entries) = fs::read_dir(&trainers_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let info_file = path.join("trainer.json");
                if info_file.exists() {
                    if let Ok(content) = fs::read_to_string(&info_file) {
                        if let Ok(mut record) = serde_json::from_str::<InstalledTrainerRecord>(&content) {
                            // 自动校准真实的 install_dir 与 exe_path（防止因手动复制/多库迁移导致路径陈旧指向原路径）
                            let real_dir = strip_verbatim_prefix(&path).to_string_lossy().to_string();
                            let mut record_changed = false;

                            if record.install_dir != real_dir {
                                record.install_dir = real_dir;
                                record_changed = true;
                            }

                            let expected_exe = path.join(&record.exe_name);
                            if expected_exe.exists() {
                                let clean_exe = strip_verbatim_prefix(&expected_exe).to_string_lossy().to_string();
                                if record.exe_path != clean_exe {
                                    record.exe_path = clean_exe;
                                    record_changed = true;
                                }
                            } else if let Ok(sub_entries) = fs::read_dir(&path) {
                                for sub in sub_entries.flatten() {
                                    let sp = sub.path();
                                    if sp.is_file() && sp.extension().map(|e| e.to_ascii_lowercase() == "exe").unwrap_or(false) {
                                        record.exe_path = strip_verbatim_prefix(&sp).to_string_lossy().to_string();
                                        record.exe_name = sp.file_name().unwrap_or_default().to_string_lossy().to_string();
                                        record_changed = true;
                                        break;
                                    }
                                }
                            }

                            if record_changed {
                                let _ = save_installed_record(record.clone());
                            }

                            // 1. 优先检测子目录下是否存在本地封面图片 (零网络秒开)
                            let cover_jpg = path.join("cover.jpg");
                            let cover_png = path.join("cover.png");
                            if cover_jpg.exists() {
                                record.capsule_image = Some(cover_jpg.to_string_lossy().to_string());
                            } else if cover_png.exists() {
                                record.capsule_image = Some(cover_png.to_string_lossy().to_string());
                            }

                            // 2. 从本地元数据持久化缓存 (game_meta_cache.json) 补齐 Steam 胶囊图、原画与 AppID
                            if record.capsule_image.is_none() || record.hero_image.is_none() || record.steam_app_id.is_none() || record.chinese_name.is_none() {
                                if let Some(cached) = crate::services::game_meta::get_cached_game_meta(&record.id, &record.name) {
                                    let mut need_save = false;
                                    if record.capsule_image.is_none() && cached.capsule_image.is_some() {
                                        record.capsule_image = cached.capsule_image;
                                        need_save = true;
                                    }
                                    if record.hero_image.is_none() && cached.hero_image.is_some() {
                                        record.hero_image = cached.hero_image;
                                        need_save = true;
                                    }
                                    if record.steam_app_id.is_none() && cached.steam_app_id.is_some() {
                                        record.steam_app_id = cached.steam_app_id;
                                        need_save = true;
                                    }
                                    if (record.chinese_name.is_none() || record.chinese_name.as_deref() == Some(&record.name)) && cached.chinese_name.is_some() {
                                        record.chinese_name = cached.chinese_name;
                                        need_save = true;
                                    }
                                    if need_save {
                                        let _ = save_installed_record(record.clone());
                                    }
                                }
                            }

                            records.push(record);
                            continue;
                        }
                    }
                }

                // 兼容：如果文件夹内没有 trainer.json，但存在 exe（用户手动放入的情况）
                if let Ok(sub_entries) = fs::read_dir(&path) {
                    let mut found_exe: Option<PathBuf> = None;
                    for sub in sub_entries.flatten() {
                        let sp = sub.path();
                        if sp.is_file() && sp.extension().map(|e| e.to_ascii_lowercase() == "exe").unwrap_or(false) {
                            found_exe = Some(sp);
                            break;
                        }
                    }

                    if let Some(exe) = found_exe {
                        let folder_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let exe_name = exe.file_name().unwrap_or_default().to_string_lossy().to_string();
                        let inferred = InstalledTrainerRecord {
                            id: folder_name.clone(),
                            name: folder_name.clone(),
                            chinese_name: Some(folder_name),
                            version: "未知".to_string(),
                            game_version: "".to_string(),
                            exe_path: exe.to_string_lossy().to_string(),
                            exe_name,
                            install_dir: path.to_string_lossy().to_string(),
                            installed_at: chrono::Local::now().to_rfc3339(),
                            last_launched_at: None,
                            steam_app_id: None,
                            thumbnail: "".to_string(),
                            hero_image: None,
                            capsule_image: None,
                            description: "".to_string(),
                            options: Vec::new(),
                            option_items: Vec::new(),
                            saved_toggles: std::collections::HashMap::new(),
                        };
                        let _ = save_installed_record(inferred.clone());
                        records.push(inferred);
                    }
                }
            }
        }
    }

    // 按安装时间倒序排序
    records.sort_by(|a, b| b.installed_at.cmp(&a.installed_at));
    records
}

/// 保存单个修改器的 trainer.json 到其安装目录
pub fn save_installed_record(record: InstalledTrainerRecord) -> Result<(), String> {
    let dir = PathBuf::from(&record.install_dir);
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    let file = dir.join("trainer.json");
    let json = serde_json::to_string_pretty(&record)
        .map_err(|e| format!("序列化 trainer.json 失败: {}", e))?;
    fs::write(&file, json).map_err(|e| format!("写入 trainer.json 失败: {}", e))?;
    Ok(())
}

/// 更新并保存指定修改器的热键开关预设
pub fn update_trainer_toggles(id: &str, toggles: std::collections::HashMap<String, bool>) -> Result<(), String> {
    let records = load_installed_records();
    let mut record = records
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("未找到修改器: {}", id))?;

    record.saved_toggles = toggles;
    save_installed_record(record)
}

/// 删除指定目录下的修改器（带根目录边界、直接子项校验与防越界拦截）
pub fn delete_installed_trainer_in_dir(id: &str, trainers_dir: &std::path::Path) -> Result<(), String> {
    let trimmed_id = id.trim();
    if trimmed_id.is_empty() {
        return Err("修改器 ID 不能为空".to_string());
    }

    if !trainers_dir.exists() {
        return Err("修改器存储目录不存在".to_string());
    }

    let canonical_root = fs::canonicalize(trainers_dir)
        .map_err(|e| format!("解析修改器存储目录失败: {}", e))?;

    // 扫描当前修改器根目录下与 id 匹配的子目录（拒绝直接信任外部记录中的 install_dir）
    let mut target_dir_to_delete: Option<PathBuf> = None;

    if let Ok(entries) = fs::read_dir(trainers_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            // 1. 如果子文件夹名称与 id 相同
            if path.file_name().and_then(|n| n.to_str()) == Some(trimmed_id) {
                target_dir_to_delete = Some(path);
                break;
            }

            // 2. 检查子目录内的 trainer.json，看其中记录的 id 是否匹配
            let info_file = path.join("trainer.json");
            if info_file.exists() {
                if let Ok(content) = fs::read_to_string(&info_file) {
                    if let Ok(record) = serde_json::from_str::<InstalledTrainerRecord>(&content) {
                        if record.id == trimmed_id {
                            target_dir_to_delete = Some(path);
                            break;
                        }
                    }
                }
            }
        }
    }

    let target_dir = match target_dir_to_delete {
        Some(d) => d,
        None => return Err(format!("在当前修改器库中未找到 ID 为 '{}' 的修改器目录", id)),
    };

    // 核心安全校验：规范化路径并严格校验目录边界
    let canonical_target = fs::canonicalize(&target_dir)
        .map_err(|e| format!("解析待删除目录路径失败: {}", e))?;

    // 1. 严禁删除根目录本身
    if canonical_target == canonical_root {
        return Err("安全拦截：禁止删除修改器根目录".to_string());
    }

    // 2. 待删除目录必须以根目录为前缀
    if !canonical_target.starts_with(&canonical_root) {
        return Err("安全拦截：待删除目录位于修改器库外部，拒绝越界删除".to_string());
    }

    // 3. 待删除目录必须是修改器根目录的直接子项，拒绝深层嵌套或非直接子目录
    if canonical_target.parent() != Some(canonical_root.as_path()) {
        return Err("安全拦截：待删除目录并非修改器根目录的直接子目录，拒绝删除".to_string());
    }

    fs::remove_dir_all(&canonical_target)
        .map_err(|e| format!("删除修改器文件夹失败: {}", e))?;

    Ok(())
}

/// 删除指定修改器目录及其全部内容（带根目录边界、直接子项校验与防越界拦截）
pub fn delete_installed_trainer(id: &str) -> Result<(), String> {
    let trainers_dir = get_trainers_dir();
    delete_installed_trainer_in_dir(id, &trainers_dir)
}

use crate::models::Trainer;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedTrainerDetail {
    pub cached_at: i64,
    pub trainer: Trainer,
}

pub fn get_trainer_cache_dir() -> PathBuf {
    let dir = get_app_data_dir().join("trainer_cache");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn load_cached_trainer(slug: &str, max_age_secs: u64) -> Option<Trainer> {
    let file = get_trainer_cache_dir().join(format!("{}.json", slug));
    if file.exists() {
        if let Ok(content) = fs::read_to_string(&file) {
            if let Ok(cached) = serde_json::from_str::<CachedTrainerDetail>(&content) {
                let now = chrono::Utc::now().timestamp();
                if now - cached.cached_at < max_age_secs as i64 {
                    return Some(cached.trainer);
                }
            }
        }
    }
    None
}

pub fn save_cached_trainer(trainer: &Trainer) {
    let slug = trainer.id.trim_matches('/').split('/').last().unwrap_or(&trainer.id);
    let file = get_trainer_cache_dir().join(format!("{}.json", slug));
    let cached = CachedTrainerDetail {
        cached_at: chrono::Utc::now().timestamp(),
        trainer: trainer.clone(),
    };
    if let Ok(json) = serde_json::to_string_pretty(&cached) {
        let _ = fs::write(file, json);
    }
}

