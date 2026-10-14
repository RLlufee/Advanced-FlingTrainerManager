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

pub fn get_download_dir() -> PathBuf {
    let dir = get_app_data_dir().join("trainers");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn load_installed_records() -> Vec<InstalledTrainerRecord> {
    let file = get_app_data_dir().join("installed_trainers.json");
    if file.exists() {
        if let Ok(content) = fs::read_to_string(&file) {
            if let Ok(records) = serde_json::from_str::<Vec<InstalledTrainerRecord>>(&content) {
                return records;
            }
        }
    }
    Vec::new()
}

pub fn save_installed_record(record: InstalledTrainerRecord) -> Result<(), String> {
    let mut records = load_installed_records();
    records.retain(|r| r.id != record.id);
    records.push(record);

    let file = get_app_data_dir().join("installed_trainers.json");
    let json = serde_json::to_string_pretty(&records)
        .map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&file, json).map_err(|e| format!("写入文件失败: {}", e))?;
    Ok(())
}

pub fn remove_installed_record(id: &str) -> Result<(), String> {
    let mut records = load_installed_records();
    records.retain(|r| r.id != id);

    let file = get_app_data_dir().join("installed_trainers.json");
    let json = serde_json::to_string_pretty(&records)
        .map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&file, json).map_err(|e| format!("写入文件失败: {}", e))?;
    Ok(())
}
