use crate::services::storage;
use chrono::Local;
use std::path::PathBuf;
use std::process::Command;

pub fn launch_trainer(id: &str) -> Result<String, String> {
    let records = storage::load_installed_records();
    let record = records
        .iter()
        .find(|r| r.id == id)
        .ok_or_else(|| format!("未找到该修改器的本地安装记录: {}", id))?;

    let exe_path = PathBuf::from(&record.exe_path);
    if !exe_path.exists() {
        return Err(format!("修改器可执行文件不存在: {}", record.exe_path));
    }

    let work_dir = PathBuf::from(&record.install_dir);

    // 启动进程
    let mut cmd = Command::new(&exe_path);
    cmd.current_dir(work_dir);

    cmd.spawn()
        .map_err(|e| format!("启动修改器失败: {}", e))?;

    // 更新最后启动时间并保存至当前目录下的 trainer.json
    let mut updated = record.clone();
    updated.last_launched_at = Some(Local::now().to_rfc3339());
    let _ = storage::save_installed_record(updated);

    let display_title = record.chinese_name.as_deref().unwrap_or(&record.name);
    Ok(format!("成功启动修改器: {}", display_title))
}

pub fn open_install_dir(dir_path: &str) -> Result<(), String> {
    let path = PathBuf::from(dir_path);
    if !path.exists() {
        return Err(format!("目标目录不存在: {}", dir_path));
    }

    Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("在资源管理器中打开失败: {}", e))?;
    Ok(())
}

pub fn open_trainers_root() -> Result<(), String> {
    let dir = storage::get_trainers_dir();
    Command::new("explorer")
        .arg(&dir)
        .spawn()
        .map_err(|e| format!("打开 trainers 根目录失败: {}", e))?;
    Ok(())
}

pub fn delete_installed_trainer(id: &str) -> Result<(), String> {
    storage::delete_installed_trainer(id)
}
