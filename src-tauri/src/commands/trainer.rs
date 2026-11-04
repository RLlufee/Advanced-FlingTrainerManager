use crate::models::{InstalledTrainerRecord, PaginatedTrainers, Trainer, TrainerUpdateInfo};
use crate::services::{downloader, launcher, scraper, storage};
use tauri::AppHandle;

#[tauri::command]
pub async fn fetch_trainers(
    page: Option<u32>,
    force_refresh: Option<bool>,
) -> Result<PaginatedTrainers, String> {
    let p = page.unwrap_or(1);
    scraper::fetch_trainers_ext(p, force_refresh.unwrap_or(false)).await
}

#[tauri::command]
pub async fn search_trainers(query: String, page: Option<u32>) -> Result<PaginatedTrainers, String> {
    let p = page.unwrap_or(1);
    scraper::search_trainers(&query, p).await
}

#[tauri::command]
pub async fn get_trainer_detail(id: String, force_refresh: Option<bool>) -> Result<Trainer, String> {
    scraper::get_trainer_detail_ext(&id, force_refresh.unwrap_or(false)).await
}

#[tauri::command]
pub async fn download_trainer(
    app: AppHandle,
    trainer: Trainer,
) -> Result<InstalledTrainerRecord, String> {
    downloader::download_and_install_trainer(app, trainer).await
}

#[tauri::command]
pub fn get_installed_trainers() -> Result<Vec<InstalledTrainerRecord>, String> {
    Ok(storage::load_installed_records())
}

#[tauri::command]
pub fn launch_trainer(id: String) -> Result<String, String> {
    launcher::launch_trainer(&id)
}

#[tauri::command]
pub fn launch_steam_game(app_id: u32) -> Result<(), String> {
    let url = format!("steam://run/{}", app_id);
    let _ = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn()
        .map_err(|e| format!("启动 Steam 游戏失败: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn open_steam_store(app_id: u32) -> Result<(), String> {
    let url = format!("https://store.steampowered.com/app/{}/", app_id);
    let _ = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn()
        .map_err(|e| format!("打开 Steam 商店失败: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn open_install_dir(dir_path: String) -> Result<(), String> {
    launcher::open_install_dir(&dir_path)
}

#[tauri::command]
pub fn open_trainers_root() -> Result<(), String> {
    launcher::open_trainers_root()
}

#[tauri::command]
pub fn delete_installed_trainer(id: String) -> Result<(), String> {
    launcher::delete_installed_trainer(&id)
}

#[tauri::command]
pub async fn launch_game_and_trainer(id: String, app_id: Option<u32>) -> Result<String, String> {
    let config = crate::services::config::load_config();

    if let Some(aid) = app_id {
        launch_steam_game(aid).map_err(|e| format!("调起 Steam 游戏失败: {}", e))?;
        let delay_ms = (config.hotkey.double_launch_delay_sec.max(1) * 1000).max(600);
        tokio::time::sleep(tokio::time::Duration::from_millis(delay_ms)).await;
    }

    let launch_msg = launcher::launch_trainer(&id)?;

    if config.hotkey.auto_sync_on_double_launch {
        let records = storage::load_installed_records();
        if let Some(record) = records.iter().find(|r| r.id == id) {
            let active_keys: Vec<String> = record
                .saved_toggles
                .iter()
                .filter(|(_, v)| **v)
                .map(|(k, _)| k.clone())
                .collect();
            if !active_keys.is_empty() {
                tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
                #[cfg(target_os = "windows")]
                crate::services::key_simulator::focus_window_for_exe(&record.exe_name);
                let _ = crate::services::key_simulator::simulate_hotkeys_sequence(&active_keys).await;
            }
        }
    }

    Ok(launch_msg)
}

#[tauri::command]
pub fn save_trainer_toggles(
    id: String,
    toggles: std::collections::HashMap<String, bool>,
) -> Result<(), String> {
    storage::update_trainer_toggles(&id, toggles)
}

#[tauri::command]
pub async fn sync_trainer_hotkeys(id: String, hotkeys: Vec<String>) -> Result<u32, String> {
    let records = storage::load_installed_records();
    let record = records
        .iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("未找到修改器: {}", id))?;

    #[cfg(target_os = "windows")]
    {
        let focused = crate::services::key_simulator::focus_window_for_exe(&record.exe_name);
        if !focused {
            return Err(format!(
                "未检测到修改器 '{}' 的运行窗口，请先启动修改器后再同步按键喵~",
                record.exe_name
            ));
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }

    crate::services::key_simulator::simulate_hotkeys_sequence(&hotkeys).await
}

#[tauri::command]
pub async fn check_trainers_update() -> Result<Vec<TrainerUpdateInfo>, String> {
    downloader::check_trainers_update().await
}

#[tauri::command]
pub async fn update_trainer_to_latest(
    app: AppHandle,
    id: String,
) -> Result<InstalledTrainerRecord, String> {
    downloader::update_trainer_to_latest(app, &id).await
}
