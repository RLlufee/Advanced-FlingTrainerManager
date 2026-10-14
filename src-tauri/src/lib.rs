pub mod models;
pub mod services;

use models::{InstalledTrainerRecord, PaginatedTrainers, Trainer};
use services::{downloader, launcher, scraper, storage};
use tauri::AppHandle;

#[tauri::command]
async fn fetch_trainers(page: Option<u32>) -> Result<PaginatedTrainers, String> {
    let p = page.unwrap_or(1);
    scraper::fetch_trainers(p).await
}

#[tauri::command]
async fn search_trainers(query: String, page: Option<u32>) -> Result<PaginatedTrainers, String> {
    let p = page.unwrap_or(1);
    scraper::search_trainers(&query, p).await
}

#[tauri::command]
async fn get_trainer_detail(id: String) -> Result<Trainer, String> {
    scraper::get_trainer_detail(&id).await
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
            launch_trainer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
