use crate::services::storage;
use chrono::Local;
use std::path::PathBuf;
use std::process::Command;

#[cfg(target_os = "windows")]
fn launch_process_elevated(exe_path: &PathBuf, work_dir: &PathBuf) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::UI::Shell::ShellExecuteW;
    use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let to_wide = |s: &OsStr| -> Vec<u16> {
        s.encode_wide().chain(std::iter::once(0)).collect()
    };

    let op = to_wide(OsStr::new("runas"));
    let file = to_wide(exe_path.as_os_str());
    let dir = to_wide(work_dir.as_os_str());

    let res = unsafe {
        ShellExecuteW(
            std::ptr::null_mut(),
            op.as_ptr(),
            file.as_ptr(),
            std::ptr::null(),
            dir.as_ptr(),
            SW_SHOWNORMAL as i32,
        )
    };

    if res as isize > 32 {
        Ok(())
    } else {
        match res as isize {
            5 => Err("启动修改器被拒绝，请确认允许管理员(UAC)提权授权喵~".to_string()),
            2 => Err("呃啊~系统找不到指定的修改器可执行程序".to_string()),
            code => Err(format!("调用管理员权限启动失败 (ShellExecuteW 代码: {})", code)),
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn launch_process_elevated(exe_path: &PathBuf, work_dir: &PathBuf) -> Result<(), String> {
    Command::new(exe_path)
        .current_dir(work_dir)
        .spawn()
        .map_err(|e| format!("启动修改器失败: {}", e))?;
    Ok(())
}

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

    // 提权启动进程
    launch_process_elevated(&exe_path, &work_dir)?;

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
