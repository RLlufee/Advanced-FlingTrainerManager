use crate::services::{monet, wallpaper};

#[tauri::command]
pub fn get_windows_accent_color() -> Result<String, String> {
    monet::get_windows_accent_color()
}

#[tauri::command]
pub fn save_monet_wallpaper_thumbnail(id: String, data_url: String) -> Result<String, String> {
    monet::save_monet_wallpaper_thumbnail(&id, &data_url)
}

#[tauri::command]
pub fn delete_monet_wallpaper_file(image_path: String) -> Result<(), String> {
    monet::delete_monet_wallpaper_file(&image_path)
}

#[tauri::command]
pub async fn read_image_as_data_url(source: String) -> Result<String, String> {
    monet::read_image_as_data_url(&source).await
}

#[tauri::command]
pub fn save_custom_wallpaper(id: String, data_url: String) -> Result<String, String> {
    wallpaper::save_custom_wallpaper(&id, &data_url)
}

#[tauri::command]
pub fn import_custom_wallpaper(id: String, source_path: String) -> Result<String, String> {
    wallpaper::import_custom_wallpaper(&id, &source_path)
}

#[tauri::command]
pub fn delete_custom_wallpaper(image_path: String) -> Result<(), String> {
    wallpaper::delete_custom_wallpaper(&image_path)
}
