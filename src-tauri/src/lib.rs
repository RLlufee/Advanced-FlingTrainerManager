pub mod models;
pub mod services;

use models::{InstalledTrainerRecord, PaginatedTrainers, Trainer};
use services::{downloader, launcher, scraper, storage};
use tauri::AppHandle;

#[tauri::command]
async fn fetch_trainers(page: Option<u32>, force_refresh: Option<bool>) -> Result<PaginatedTrainers, String> {
    let p = page.unwrap_or(1);
    scraper::fetch_trainers_ext(p, force_refresh.unwrap_or(false)).await
}

#[tauri::command]
async fn search_trainers(query: String, page: Option<u32>) -> Result<PaginatedTrainers, String> {
    let p = page.unwrap_or(1);
    scraper::search_trainers(&query, p).await
}

#[tauri::command]
async fn get_trainer_detail(id: String, force_refresh: Option<bool>) -> Result<Trainer, String> {
    scraper::get_trainer_detail_ext(&id, force_refresh.unwrap_or(false)).await
}


#[tauri::command]
async fn download_trainer(app: AppHandle, trainer: Trainer) -> Result<InstalledTrainerRecord, String> {
    downloader::download_and_install_trainer(app, trainer).await
}

#[tauri::command]
fn get_installed_trainers() -> Result<Vec<InstalledTrainerRecord>, String> {
    Ok(storage::load_installed_records())
}

#[tauri::command]
fn launch_trainer(id: String) -> Result<String, String> {
    launcher::launch_trainer(&id)
}

#[tauri::command]
fn launch_steam_game(app_id: u32) -> Result<(), String> {
    let url = format!("steam://run/{}", app_id);
    let _ = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn()
        .map_err(|e| format!("启动 Steam 游戏失败: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_steam_store(app_id: u32) -> Result<(), String> {
    let url = format!("https://store.steampowered.com/app/{}/", app_id);
    let _ = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", &url])
        .spawn()
        .map_err(|e| format!("打开 Steam 商店失败: {}", e))?;
    Ok(())
}

#[tauri::command]
fn open_install_dir(dir_path: String) -> Result<(), String> {
    launcher::open_install_dir(&dir_path)
}

#[tauri::command]
fn open_trainers_root() -> Result<(), String> {
    launcher::open_trainers_root()
}

#[tauri::command]
fn delete_installed_trainer(id: String) -> Result<(), String> {
    launcher::delete_installed_trainer(&id)
}

#[tauri::command]
async fn launch_game_and_trainer(id: String, app_id: Option<u32>) -> Result<String, String> {
    if let Some(aid) = app_id {
        let _ = launch_steam_game(aid);
        tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
    }
    launcher::launch_trainer(&id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fetch_trainers,
            search_trainers,
            get_trainer_detail,
            download_trainer,
            get_installed_trainers,
            launch_trainer,
            launch_steam_game,
            open_steam_store,
            open_install_dir,
            open_trainers_root,
            delete_installed_trainer,
            launch_game_and_trainer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
