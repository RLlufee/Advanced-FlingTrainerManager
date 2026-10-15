use crate::services::storage::{self, get_app_data_dir, load_installed_records, save_installed_record};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// 1. 热键与模拟引擎设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeySettings {
    /// 以管理员身份提权启动修改器 (默认 true)
    pub run_as_admin: bool,
    /// 模拟按键之间的间隔延迟 (毫秒，默认 100ms)
    pub key_interval_ms: u64,
    /// 单个按键按下的持续时长 (毫秒，默认 40ms)
    pub key_hold_ms: u64,
    /// 一键双启时自动模拟同步预设 (默认 true)
    pub auto_sync_on_double_launch: bool,
    /// 一键双启后延迟 N 秒执行模拟 (默认 3s)
    pub double_launch_delay_sec: u64,
    /// 模拟按键完成时显示浮窗提示 (默认 true)
    pub show_sync_toast: bool,
}

impl Default for HotkeySettings {
    fn default() -> Self {
        Self {
            run_as_admin: true,
            key_interval_ms: 100,
            key_hold_ms: 40,
            auto_sync_on_double_launch: true,
            double_launch_delay_sec: 3,
            show_sync_toast: true,
        }
    }
}

/// 2. 便携存储与文件管理设置 (预留给第二步)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagementSettings {
    pub custom_trainers_dir: Option<String>,
    pub auto_extract_zip: bool,
    pub scan_depth: u32,
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

impl Default for ManagementSettings {
    fn default() -> Self {
        Self {
            custom_trainers_dir: None,
            auto_extract_zip: true,
            scan_depth: 2,
            close_to_tray: true,
            launch_at_startup: false,
        }
    }
}

/// 3. 网络与加速源设置 (预留给第三步)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSettings {
    pub proxy_url: String,
    pub update_source: String, // "github" | "mirror"
    pub enable_steam_cdn: bool,
    pub timeout_ms: u64,
}

impl Default for NetworkSettings {
    fn default() -> Self {
        Self {
            proxy_url: "".to_string(),
            update_source: "github".to_string(),
            enable_steam_cdn: true,
            timeout_ms: 5000,
        }
    }
}

/// 全局应用程序配置实体
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub hotkey: HotkeySettings,
    pub management: ManagementSettings,
    pub network: NetworkSettings,
}

fn get_config_file_path() -> PathBuf {
    get_app_data_dir().join("app_config.json")
}

/// 读取应用全局配置，若不存在则生成默认配置
pub fn load_config() -> AppConfig {
    let file = get_config_file_path();
    if file.exists() {
        if let Ok(content) = fs::read_to_string(&file) {
            if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
                return config;
            }
        }
    }
    let default_config = AppConfig::default();
    let _ = save_config(&default_config);
    default_config
}

/// 保存应用全局配置
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let file = get_config_file_path();
    if let Some(parent) = file.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&file, json).map_err(|e| format!("写入配置文件失败: {}", e))?;
    Ok(())
}

/// 预设备份单项实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainerPresetBackupItem {
    pub id: String,
    pub name: String,
    pub chinese_name: Option<String>,
    pub saved_toggles: HashMap<String, bool>,
}

/// 导出所有已安装修改器的开关预设为 JSON
pub fn export_all_presets() -> Result<String, String> {
    let records = load_installed_records();
    let items: Vec<TrainerPresetBackupItem> = records
        .into_iter()
        .filter(|r| !r.saved_toggles.is_empty())
        .map(|r| TrainerPresetBackupItem {
            id: r.id,
            name: r.name,
            chinese_name: r.chinese_name,
            saved_toggles: r.saved_toggles,
        })
        .collect();

    serde_json::to_string_pretty(&items)
        .map_err(|e| format!("导出预设序列化失败: {}", e))
}

/// 从 JSON 恢复导入所有修改器的预设
pub fn import_all_presets(json_str: &str) -> Result<u32, String> {
    let items: Vec<TrainerPresetBackupItem> = serde_json::from_str(json_str)
        .map_err(|e| format!("导入预设解析失败，请确保格式正确: {}", e))?;

    let mut records = load_installed_records();
    let mut updated_count = 0u32;

    for item in items {
        if let Some(record) = records.iter_mut().find(|r| r.id == item.id || r.name == item.name) {
            record.saved_toggles = item.saved_toggles;
            let _ = save_installed_record(record.clone());
            updated_count += 1;
        }
    }

    Ok(updated_count)
}

/// 清空所有已安装修改器的开关预设
pub fn clear_all_presets() -> Result<u32, String> {
    let mut records = load_installed_records();
    let mut cleared_count = 0u32;

    for record in records.iter_mut() {
        if !record.saved_toggles.is_empty() {
            record.saved_toggles.clear();
            let _ = save_installed_record(record.clone());
            cleared_count += 1;
        }
    }

    Ok(cleared_count)
}

/// 存储与缓存统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub trainers_dir: String,
    pub trainers_count: usize,
    pub total_size_bytes: u64,
    pub cover_cache_size_bytes: u64,
    pub cover_cache_count: usize,
    pub offline_dict_count: usize,
}

/// 缓存清理结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanSummary {
    pub cleaned_files_count: usize,
    pub freed_bytes: u64,
}

/// 获取存储与缓存统计信息
pub fn get_storage_stats() -> Result<StorageStats, String> {
    let trainers_dir = storage::get_trainers_dir();
    let records = load_installed_records();

    let mut total_size_bytes = 0u64;
    let mut cover_cache_size_bytes = 0u64;
    let mut cover_cache_count = 0usize;

    // 递归统计 trainers 目录
    if trainers_dir.exists() {
        if let Ok(entries) = fs::read_dir(&trainers_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    if let Ok(sub_entries) = fs::read_dir(&p) {
                        for sub in sub_entries.flatten() {
                            let sp = sub.path();
                            if let Ok(meta) = sp.metadata() {
                                let len = meta.len();
                                total_size_bytes += len;

                                let file_name = sp.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                                if file_name == "cover.jpg" || file_name == "cover.png" {
                                    cover_cache_size_bytes += len;
                                    cover_cache_count += 1;
                                }
                            }
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

    // 1. 清理临时解压目录 fling_import_tmp
    let temp_import_dir = std::env::temp_dir().join("fling_import_tmp");
    if temp_import_dir.exists() {
        if let Ok(entries) = fs::read_dir(&temp_import_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if let Ok(meta) = p.metadata() {
                    freed_bytes += meta.len();
                    let _ = fs::remove_file(&p);
                    cleaned_files_count += 1;
                }
            }
        }
        let _ = fs::remove_dir(&temp_import_dir);
    }

    Ok(CleanSummary {
        cleaned_files_count,
        freed_bytes,
    })
}

/// 一键无损迁移所有已安装修改器至新目录
pub fn migrate_trainers_dir(new_dir_str: &str) -> Result<u32, String> {
    let target_dir = PathBuf::from(new_dir_str.trim());
    if target_dir.to_string_lossy().trim().is_empty() {
        return Err("目标目录路径不能为空".to_string());
    }

    let current_dir = storage::get_trainers_dir();
    if current_dir == target_dir {
        return Err("目标路径与当前路径相同，无需迁移".to_string());
    }

    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("创建目标目录失败: {}", e))?;

    let mut migrated_count = 0u32;

    if current_dir.exists() {
        if let Ok(entries) = fs::read_dir(&current_dir) {
            for entry in entries.flatten() {
                let old_game_dir = entry.path();
                if old_game_dir.is_dir() {
                    let folder_name = old_game_dir.file_name().unwrap_or_default();
                    let new_game_dir = target_dir.join(folder_name);

                    // 移动文件夹
                    let moved = if fs::rename(&old_game_dir, &new_game_dir).is_ok() {
                        true
                    } else {
                        // 跨驱动器 fallback：拷贝后删除
                        if copy_dir_all(&old_game_dir, &new_game_dir).is_ok() {
                            let _ = fs::remove_dir_all(&old_game_dir);
                            true
                        } else {
                            false
                        }
                    };

                    if moved {
                        // 修正该子目录内的 trainer.json
                        let info_file = new_game_dir.join("trainer.json");
                        if info_file.exists() {
                            if let Ok(content) = fs::read_to_string(&info_file) {
                                if let Ok(mut record) = serde_json::from_str::<crate::models::InstalledTrainerRecord>(&content) {
                                    record.install_dir = new_game_dir.to_string_lossy().to_string();
                                    let new_exe = new_game_dir.join(&record.exe_name);
                                    if new_exe.exists() {
                                        record.exe_path = new_exe.to_string_lossy().to_string();
                                    }
                                    let new_cover = new_game_dir.join("cover.jpg");
                                    if new_cover.exists() {
                                        record.capsule_image = Some(new_cover.to_string_lossy().to_string());
                                    }
                                    let _ = storage::save_installed_record(record);
                                }
                            }
                        }
                        migrated_count += 1;
                    }
                }
            }
        }
    }

    // 更新全局配置中的 custom_trainers_dir
    let mut config = load_config();
    config.management.custom_trainers_dir = Some(target_dir.to_string_lossy().to_string());
    save_config(&config)?;

    Ok(migrated_count)
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

/// 配置 Windows 开机自启
pub fn set_launch_at_startup(enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let exe = std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;
        let exe_str = exe.to_string_lossy();

        if enable {
            let cmd = format!(
                r#"Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AdvancedFlingTrainerManager" -Value '"{}"' -Force"#,
                exe_str
            );
            let output = Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", &cmd])
                .output()
                .map_err(|e| format!("配置开机自启失败: {}", e))?;
            if !output.status.success() {
                return Err("设置开机自启注册表失败".to_string());
            }
        } else {
            let cmd = r#"Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AdvancedFlingTrainerManager" -ErrorAction SilentlyContinue"#;
            let _ = Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", cmd])
                .output();
        }
    }

    let mut config = load_config();
    config.management.launch_at_startup = enable;
    save_config(&config)?;

    Ok(())
}

