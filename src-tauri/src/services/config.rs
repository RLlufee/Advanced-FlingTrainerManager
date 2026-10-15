use crate::services::storage::{get_app_data_dir, load_installed_records, save_installed_record};
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
