use crate::models::{BatchEnrichResult, InstalledTrainerRecord};
use crate::services::importer::{self, ImportSummary};

#[tauri::command]
pub fn pick_external_folder() -> Result<Option<String>, String> {
    importer::pick_folder_dialog()
}

#[tauri::command]
pub async fn scan_and_import_trainers(folder_path: String) -> Result<ImportSummary, String> {
    importer::scan_and_import_trainers(&folder_path).await
}

#[tauri::command]
pub async fn enrich_installed_trainer(id: String) -> Result<InstalledTrainerRecord, String> {
    importer::enrich_installed_trainer(&id).await
}

#[tauri::command]
pub async fn enrich_all_installed_trainers() -> Result<BatchEnrichResult, String> {
    importer::enrich_all_installed_trainers().await
}
