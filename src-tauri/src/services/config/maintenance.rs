use super::models::{CleanSummary, StorageStats};
use crate::services::storage::{self, load_installed_records};
use std::fs;

/// 获取存储与缓存统计信息
pub fn get_storage_stats() -> Result<StorageStats, String> {
    let trainers_dir = storage::get_trainers_dir();
    let records = load_installed_records();

    let mut total_size_bytes = 0u64;
    let mut cover_cache_size_bytes = 0u64;
    let mut cover_cache_count = 0usize;

    // 递归统计 trainers 目录
    if trainers_dir.exists()
        && let Ok(entries) = fs::read_dir(&trainers_dir)
    {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir()
                && let Ok(sub_entries) = fs::read_dir(&p)
            {
                for sub in sub_entries.flatten() {
                    let sp = sub.path();
                    if let Ok(meta) = sp.metadata() {
                        let len = meta.len();
                        total_size_bytes += len;

                        let file_name = sp
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_lowercase();
                        if file_name == "cover.jpg" || file_name == "cover.png" {
                            cover_cache_size_bytes += len;
                            cover_cache_count += 1;
                        }
                    }
                }
            }
        }
    }

    let offline_dict_count = crate::services::game_meta::get_offline_dictionary_count();

    Ok(StorageStats {
        trainers_dir: trainers_dir.to_string_lossy().to_string(),
        trainers_count: records.len(),
        total_size_bytes,
        cover_cache_size_bytes,
        cover_cache_count,
        offline_dict_count,
    })
}

/// 清理孤立缓存与临时解压文件
pub fn clean_orphan_cache() -> Result<CleanSummary, String> {
    let mut cleaned_files_count = 0usize;
    let mut freed_bytes = 0u64;

    // 清理以 fling_import_tmp 开头的临时解压目录与文件
    let temp_dir = std::env::temp_dir();
    if let Ok(entries) = fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            let file_name = p.file_name().unwrap_or_default().to_string_lossy();
            if file_name.starts_with("fling_import_tmp") {
                if p.is_dir() {
                    if let Ok(sub_entries) = fs::read_dir(&p) {
                        for sub in sub_entries.flatten() {
                            let sp = sub.path();
                            if sp.is_file()
                                && let Ok(meta) = sp.metadata()
                            {
                                let len = meta.len();
                                if fs::remove_file(&sp).is_ok() {
                                    freed_bytes += len;
                                    cleaned_files_count += 1;
                                }
                            }
                        }
                    }
                    let _ = fs::remove_dir_all(&p);
                } else if p.is_file()
                    && let Ok(meta) = p.metadata()
                {
                    let len = meta.len();
                    if fs::remove_file(&p).is_ok() {
                        freed_bytes += len;
                        cleaned_files_count += 1;
                    }
                }
            }
        }
    }

    Ok(CleanSummary {
        cleaned_files_count,
        freed_bytes,
    })
}
