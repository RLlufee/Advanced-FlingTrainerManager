use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainerOptionItem {
    pub title: String,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trainer {
    pub id: String,
    pub name: String,
    pub version: String,
    pub game_version: String,
    pub download_url: String,
    pub description: String,
    pub thumbnail: String,
    pub download_count: u64,
    pub last_update: String,
    pub options: Vec<String>,
    pub option_items: Vec<TrainerOptionItem>,
    pub installed_path: Option<String>,
    pub is_installed: bool,
    #[serde(default)]
    pub chinese_name: Option<String>,
    #[serde(default)]
    pub steam_app_id: Option<u32>,
    #[serde(default)]
    pub hero_image: Option<String>,
    #[serde(default)]
    pub capsule_image: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedTrainers {
    pub trainers: Vec<Trainer>,
    pub page: u32,
    pub total_pages: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgressPayload {
    pub trainer_id: String,
    pub progress: f64,
    pub downloaded_bytes: u64,
    pub total_bytes: Option<u64>,
    pub speed_bytes_per_sec: u64,
    pub status: String, // "downloading" | "extracting" | "completed" | "error"
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledTrainerRecord {
    pub id: String,
    pub name: String,
    pub version: String,
    pub exe_path: String,
    pub install_dir: String,
    pub installed_at: String,
    pub last_launched_at: Option<String>,
}
