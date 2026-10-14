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

    // 更新最后启动时间
    let mut updated = record.clone();
    updated.last_launched_at = Some(Local::now().to_rfc3339());
    let _ = storage::save_installed_record(updated);

    Ok(format!("成功启动修改器: {}", record.name))
}
