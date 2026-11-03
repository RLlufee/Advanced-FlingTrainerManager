use super::models::TrainerPresetBackupItem;
use crate::services::storage::{load_installed_records, save_installed_record};

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

    serde_json::to_string_pretty(&items).map_err(|e| format!("导出预设序列化失败: {}", e))
}

/// 从 JSON 恢复导入所有修改器的预设（严格核验写盘结果，写盘失败不计入成功）
pub fn import_all_presets(json_str: &str) -> Result<u32, String> {
    let items: Vec<TrainerPresetBackupItem> = serde_json::from_str(json_str)
        .map_err(|e| format!("导入预设解析失败，请确保格式正确: {}", e))?;

    let mut records = load_installed_records();
    let mut updated_count = 0u32;

    for item in items {
        if let Some(record) = records
            .iter_mut()
            .find(|r| r.id == item.id || r.name == item.name)
        {
            record.saved_toggles = item.saved_toggles;
            if let Err(e) = save_installed_record(record.clone()) {
                eprintln!("预设落盘失败 [{}]: {}", record.id, e);
                continue;
            }
            updated_count += 1;
        }
    }

    Ok(updated_count)
}

/// 清空所有已安装修改器的开关预设（严格核验写盘结果）
pub fn clear_all_presets() -> Result<u32, String> {
    let mut records = load_installed_records();
    let mut cleared_count = 0u32;

    for record in records.iter_mut() {
        if !record.saved_toggles.is_empty() {
            record.saved_toggles.clear();
            if let Err(e) = save_installed_record(record.clone()) {
                eprintln!("清空预设写盘失败 [{}]: {}", record.id, e);
                continue;
            }
            cleared_count += 1;
        }
    }

    Ok(cleared_count)
}
