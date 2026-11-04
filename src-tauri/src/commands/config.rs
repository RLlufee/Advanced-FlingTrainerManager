use crate::services::config::{
    self, AppConfig, CleanSummary, NetworkTestResult, StorageStats,
};

#[tauri::command]
pub fn get_app_config() -> AppConfig {
    config::load_config()
}

#[tauri::command]
pub fn save_app_config(app_config: AppConfig) -> Result<(), String> {
    config::save_config(&app_config)
}

#[tauri::command]
pub fn export_all_presets() -> Result<String, String> {
    config::export_all_presets()
}

#[tauri::command]
pub fn import_all_presets(json_str: String) -> Result<u32, String> {
    config::import_all_presets(&json_str)
}

#[tauri::command]
pub fn clear_all_presets() -> Result<u32, String> {
    config::clear_all_presets()
}

#[tauri::command]
pub fn get_storage_stats() -> Result<StorageStats, String> {
    config::get_storage_stats()
}

#[tauri::command]
pub fn clean_orphan_cache() -> Result<CleanSummary, String> {
    config::clean_orphan_cache()
}

#[tauri::command]
pub fn migrate_trainers_dir(new_dir: String) -> Result<u32, String> {
    config::migrate_trainers_dir(&new_dir)
}

#[tauri::command]
pub fn set_launch_at_startup(enable: bool) -> Result<(), String> {
    config::set_launch_at_startup(enable)
}

#[tauri::command]
pub async fn test_network_connectivity(
    target: Option<String>,
) -> Result<NetworkTestResult, String> {
    config::test_network_connectivity(target).await
}
