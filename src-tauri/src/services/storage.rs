use crate::models::InstalledTrainerRecord;
use directories::ProjectDirs;
use std::fs;
use std::path::{Path, PathBuf};

/// 修改器库根目录专属标记文件名（用于识别受管库目录，防止普通游戏目录被误当成修改器库）
pub const LIBRARY_MARKER_FILE: &str = ".fling_library";
/// 单个修改器安装目录专属标记文件名
pub const TRAINER_MARKER_FILE: &str = ".fling_managed";
/// 自动追加的专用子目录名称
pub const DEDICATED_LIBRARY_SUBDIR: &str = "FlingTrainers";

/// 判断路径是否禁止直接作为修改器库根目录（如非绝对路径、磁盘根目录 C:\ 等）
pub fn is_forbidden_root_dir(dir: &Path) -> bool {
    dir.as_os_str().is_empty() || !dir.is_absolute() || dir.parent().is_none()
}

/// 写入修改器库根目录专属标记文件
pub fn write_library_marker(dir: &Path) -> Result<(), String> {
    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| format!("创建修改器库目录失败: {}", e))?;
    }
    let marker = dir.join(LIBRARY_MARKER_FILE);
    if !marker.exists() {
        let payload = serde_json::json!({
            "app": "Advanced-FlingTrainerManager",
            "schema": 1,
            "created_at": chrono::Utc::now().to_rfc3339(),
        });
        let content = serde_json::to_string_pretty(&payload)
            .map_err(|e| format!("序列化库标记失败: {}", e))?;
        crate::services::config::atomic_write_file(&marker, content.as_bytes())?;
    }
    Ok(())
}

/// 判断目录是否可安全直接作为修改器根目录：
/// 1. 尚不存在或为空目录；2. 带有本应用 `.fling_library` 标记；
/// 3. 兼容旧版库：目录下无普通文件，且所有非隐藏子目录均包含 `trainer.json`
pub fn is_safe_library_dir(dir: &Path) -> bool {
    if !dir.exists() {
        return true;
    }
    if !dir.is_dir() {
        return false;
    }
    if dir.join(LIBRARY_MARKER_FILE).exists() {
        return true;
    }

    let Ok(entries) = fs::read_dir(dir) else {
        return false;
    };

    let mut non_hidden_dirs = 0usize;
    let mut trainer_dirs = 0usize;
    let mut non_hidden_files = 0usize;

    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with('.') {
            continue;
        }
        let path = entry.path();
        if path.is_dir() {
            non_hidden_dirs += 1;
            if path.join("trainer.json").exists() {
                trainer_dirs += 1;
            }
        } else {
            non_hidden_files += 1;
        }
    }

    if non_hidden_dirs == 0 && non_hidden_files == 0 {
        return true;
    }

    non_hidden_files == 0 && trainer_dirs > 0 && trainer_dirs == non_hidden_dirs
}

/// 解析安全的修改器存储目标目录：若用户选择了磁盘根目录或含其它文件的普通目录（如 D:\Games），自动隔离至其下 FlingTrainers 专用子目录
pub fn resolve_safe_trainers_target_dir(selected_dir: &str) -> Result<PathBuf, String> {
    let trimmed = selected_dir.trim();
    if trimmed.is_empty() {
        return Err("目标目录路径不能为空".to_string());
    }

    let raw = PathBuf::from(trimmed);
    if !raw.is_absolute() {
        return Err("修改器存储目录必须为绝对路径".to_string());
    }

    let needs_dedicated_subdir = if is_forbidden_root_dir(&raw) {
        true
    } else if raw.exists() {
        if !raw.is_dir() {
            return Err("所选目标路径不是有效文件夹".to_string());
        }
        !is_safe_library_dir(&raw)
    } else {
        false
    };

    if needs_dedicated_subdir {
        let dedicated = raw.join(DEDICATED_LIBRARY_SUBDIR);
        if dedicated.exists() && !is_safe_library_dir(&dedicated) {
            return Err(format!(
                "目录 '{}' 内的专用子目录 '{}' 已存在非本应用的其它文件，请更换一个空目录",
                raw.display(),
                DEDICATED_LIBRARY_SUBDIR
            ));
        }
        Ok(dedicated)
    } else {
        Ok(raw)
    }
}

/// 校验配置保存时传入的 custom_trainers_dir 是否安全（拦截盘符根目录及未受管的非空普通目录）
pub fn validate_custom_trainers_dir(
    custom_dir: &str,
    previous_dir: Option<&str>,
) -> Result<(), String> {
    let trimmed = custom_dir.trim();
    if trimmed.is_empty() {
        return Ok(());
    }

    if let Some(prev) = previous_dir
        && prev.trim().eq_ignore_ascii_case(trimmed)
    {
        return Ok(());
    }

    let p = Path::new(trimmed);
    if is_forbidden_root_dir(p) {
        return Err("安全拦截：不能直接将磁盘根目录或相对路径设为修改器存储目录".to_string());
    }
    if p.exists() && !is_safe_library_dir(p) {
        return Err(
            "安全拦截：所选目录为非空普通目录（可能包含其他游戏或文件），禁止直接设为修改器根目录"
                .to_string(),
        );
    }
    Ok(())
}

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
    if config_file.exists()
        && let Ok(content) = fs::read_to_string(&config_file)
        && let Ok(v) = serde_json::from_str::<serde_json::Value>(&content)
        && let Some(custom) = v
            .get("management")
            .and_then(|m| m.get("custom_trainers_dir"))
            .and_then(|c| c.as_str())
    {
        let trimmed = custom.trim();
        if !trimmed.is_empty() {
            let path = PathBuf::from(trimmed);
            let _ = fs::create_dir_all(&path);
            return path;
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
        exe.parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::from("."))
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

/// 扫描指定修改器根目录下的所有受管子文件夹，读取每个修改器的 trainer.json（严格只读建档目录，绝不向普通目录写入推断记录）
pub fn load_installed_records_in_dir(trainers_dir: &Path) -> Vec<InstalledTrainerRecord> {
    let mut records = Vec::new();

    if let Ok(entries) = fs::read_dir(trainers_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            // 跳过隐藏目录与临时暂存目录（如 .staging_*）
            if path
                .file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| n.starts_with('.'))
            {
                continue;
            }

            let info_file = path.join("trainer.json");
            if !info_file.exists() {
                continue;
            }

            if let Ok(content) = fs::read_to_string(&info_file) {
                match serde_json::from_str::<InstalledTrainerRecord>(&content) {
                    Ok(mut record) => {
                        // 自动校准真实的 install_dir 与 exe_path（防止因手动复制/多库迁移导致路径陈旧指向原路径）
                        let real_dir = strip_verbatim_prefix(&path).to_string_lossy().to_string();
                        let mut record_changed = false;

                        if record.install_dir != real_dir {
                            record.install_dir = real_dir;
                            record_changed = true;
                        }

                        let expected_exe = path.join(&record.exe_name);
                        if expected_exe.exists() {
                            let clean_exe = strip_verbatim_prefix(&expected_exe)
                                .to_string_lossy()
                                .to_string();
                            if record.exe_path != clean_exe {
                                record.exe_path = clean_exe;
                                record_changed = true;
                            }
                        } else if let Ok(sub_entries) = fs::read_dir(&path) {
                            for sub in sub_entries.flatten() {
                                let sp = sub.path();
                                if sp.is_file()
                                    && sp
                                        .extension()
                                        .map(|e| e.eq_ignore_ascii_case("exe"))
                                        .unwrap_or(false)
                                {
                                    record.exe_path = strip_verbatim_prefix(&sp)
                                        .to_string_lossy()
                                        .to_string();
                                    record.exe_name = sp
                                        .file_name()
                                        .unwrap_or_default()
                                        .to_string_lossy()
                                        .to_string();
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
                        if (record.capsule_image.is_none()
                            || record.hero_image.is_none()
                            || record.steam_app_id.is_none()
                            || record.chinese_name.is_none())
                            && let Some(cached) = crate::services::game_meta::get_cached_game_meta(
                                &record.id,
                                &record.name,
                            )
                        {
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
                            if (record.chinese_name.is_none()
                                || record.chinese_name.as_deref() == Some(&record.name))
                                && cached.chinese_name.is_some()
                            {
                                record.chinese_name = cached.chinese_name;
                                need_save = true;
                            }
                            if need_save {
                                let _ = save_installed_record(record.clone());
                            }
                        }

                        records.push(record);
                    }
                    Err(e) => {
                        // 损坏文件安全隔离与备份，严禁自动覆盖或重建
                        let corrupt_backup = path.join(format!(
                            "trainer.json.corrupt.{}.json",
                            chrono::Utc::now().timestamp()
                        ));
                        let _ = fs::copy(&info_file, &corrupt_backup);
                        eprintln!(
                            "修改器记录文件 {:?} 损坏，已备份至 {:?}: {}",
                            info_file, corrupt_backup, e
                        );
                    }
                }
            }
        }
    }

    // 按安装时间倒序排序
    records.sort_by(|a, b| b.installed_at.cmp(&a.installed_at));
    records
}

/// 扫描 trainers 目录下的所有受管子文件夹，读取每个修改器的 trainer.json
pub fn load_installed_records() -> Vec<InstalledTrainerRecord> {
    let trainers_dir = get_trainers_dir();
    load_installed_records_in_dir(&trainers_dir)
}

/// 保存单个修改器的 trainer.json 到其安装目录（原子安全写入，并写入受管归属标记）
pub fn save_installed_record(record: InstalledTrainerRecord) -> Result<(), String> {
    let dir = PathBuf::from(&record.install_dir);
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    let file = dir.join("trainer.json");
    let json = serde_json::to_string_pretty(&record)
        .map_err(|e| format!("序列化 trainer.json 失败: {}", e))?;
    crate::services::config::atomic_write_file(&file, json.as_bytes())?;

    let marker_file = dir.join(TRAINER_MARKER_FILE);
    if !marker_file.exists() {
        let marker = serde_json::json!({
            "app": "Advanced-FlingTrainerManager",
            "id": record.id,
        });
        if let Ok(marker_json) = serde_json::to_string(&marker) {
            let _ = crate::services::config::atomic_write_file(&marker_file, marker_json.as_bytes());
        }
    }
    Ok(())
}

/// 更新并保存指定修改器的热键开关预设
pub fn update_trainer_toggles(
    id: &str,
    toggles: std::collections::HashMap<String, bool>,
) -> Result<(), String> {
    let records = load_installed_records();
    let mut record = records
        .into_iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("未找到修改器: {}", id))?;

    record.saved_toggles = toggles;
    save_installed_record(record)
}

/// 删除指定目录下的修改器（带根目录边界、直接子项校验与受管归属标记核验）
pub fn delete_installed_trainer_in_dir(
    id: &str,
    trainers_dir: &std::path::Path,
) -> Result<(), String> {
    let trimmed_id = id.trim();
    if trimmed_id.is_empty() {
        return Err("修改器 ID 不能为空".to_string());
    }

    if !trainers_dir.exists() {
        return Err("修改器存储目录不存在".to_string());
    }

    let canonical_root =
        fs::canonicalize(trainers_dir).map_err(|e| format!("解析修改器存储目录失败: {}", e))?;

    // 仅扫描当前修改器根目录下包含有效 trainer.json 且 id 匹配的子目录（绝不仅凭文件夹名称直接删除未受管目录）
    let mut target_dir_to_delete: Option<PathBuf> = None;

    if let Ok(entries) = fs::read_dir(trainers_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            if path
                .file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| n.starts_with('.'))
            {
                continue;
            }

            let info_file = path.join("trainer.json");
            if info_file.exists()
                && let Ok(content) = fs::read_to_string(&info_file)
                && let Ok(record) = serde_json::from_str::<InstalledTrainerRecord>(&content)
                && record.id == trimmed_id
            {
                target_dir_to_delete = Some(path);
                break;
            }
        }
    }

    let target_dir = match target_dir_to_delete {
        Some(d) => d,
        None => {
            return Err(format!(
                "在当前修改器库中未找到 ID 为 '{}' 的受管修改器目录",
                id
            ));
        }
    };

    // 核心安全校验：规范化路径并严格校验目录边界
    let canonical_target =
        fs::canonicalize(&target_dir).map_err(|e| format!("解析待删除目录路径失败: {}", e))?;

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

    // 4. 删除前最终核验本应用归属标记/建档文件存在，防止误删普通游戏目录
    if !canonical_target.join("trainer.json").is_file()
        && !canonical_target.join(TRAINER_MARKER_FILE).is_file()
    {
        return Err("安全拦截：目标目录缺少修改器归属标记，拒绝删除".to_string());
    }

    fs::remove_dir_all(&canonical_target).map_err(|e| format!("删除修改器文件夹失败: {}", e))?;

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
    if file.exists()
        && let Ok(content) = fs::read_to_string(&file)
        && let Ok(cached) = serde_json::from_str::<CachedTrainerDetail>(&content)
    {
        let now = chrono::Utc::now().timestamp();
        if now - cached.cached_at < max_age_secs as i64 {
            return Some(cached.trainer);
        }
    }
    None
}

pub fn save_cached_trainer(trainer: &Trainer) {
    let slug = trainer
        .id
        .trim_matches('/')
        .split('/')
        .next_back()
        .unwrap_or(&trainer.id);
    let file = get_trainer_cache_dir().join(format!("{}.json", slug));
    let cached = CachedTrainerDetail {
        cached_at: chrono::Utc::now().timestamp(),
        trainer: trainer.clone(),
    };
    if let Ok(json) = serde_json::to_string_pretty(&cached) {
        let _ = fs::write(file, json);
    }
}
