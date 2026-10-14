use crate::models::InstalledTrainerRecord;
use directories::ProjectDirs;
use std::fs;
use std::path::PathBuf;

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

/// 获取与主程序同级的 trainers 便携式目录
pub fn get_trainers_dir() -> PathBuf {
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
                            // 校验 exe 文件路径是否真实存在，若失效（例如移动了目录）则自动校正
                            let current_exe = PathBuf::from(&record.exe_path);
                            if !current_exe.exists() {
                                if let Ok(sub_entries) = fs::read_dir(&path) {
                                    for sub in sub_entries.flatten() {
                                        let sp = sub.path();
                                        if sp.is_file() && sp.extension().map(|e| e.to_ascii_lowercase() == "exe").unwrap_or(false) {
                                            record.exe_path = sp.to_string_lossy().to_string();
                                            record.exe_name = sp.file_name().unwrap_or_default().to_string_lossy().to_string();
                                            record.install_dir = path.to_string_lossy().to_string();
                                            let _ = save_installed_record(record.clone());
                                            break;
                                        }
                                    }
                                }
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

/// 删除指定修改器目录及其全部内容
pub fn delete_installed_trainer(id: &str) -> Result<(), String> {
    let records = load_installed_records();
    if let Some(target) = records.iter().find(|r| r.id == id) {
        let dir = PathBuf::from(&target.install_dir);
        if dir.exists() {
            fs::remove_dir_all(&dir)
                .map_err(|e| format!("删除修改器文件夹失败: {}", e))?;
        }
        return Ok(());
    }
    Err("未找到要删除的修改器目录".to_string())
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

