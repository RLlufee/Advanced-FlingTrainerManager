use crate::services::storage;
use chrono::Local;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(target_os = "windows")]
fn launch_process_elevated(exe_path: &Path, work_dir: &Path) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::UI::Shell::ShellExecuteW;
    use windows_sys::Win32::UI::WindowsAndMessaging::SW_SHOWNORMAL;

    let to_wide = |s: &OsStr| -> Vec<u16> { s.encode_wide().chain(std::iter::once(0)).collect() };

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
            SW_SHOWNORMAL,
        )
    };

    if res as isize > 32 {
        Ok(())
    } else {
        match res as isize {
            5 => Err("启动修改器被拒绝，请确认允许管理员(UAC)提权授权喵~".to_string()),
            2 => Err("呃啊~系统找不到指定的修改器可执行程序".to_string()),
            code => Err(format!(
                "调用管理员权限启动失败 (ShellExecuteW 代码: {})",
                code
            )),
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

    verify_record_exe_integrity(record, &exe_path)?;

    let work_dir = PathBuf::from(&record.install_dir);

    let config = crate::services::config::load_config();
    if config.hotkey.run_as_admin {
        // 提权管理员启动进程
        launch_process_elevated(&exe_path, &work_dir)?;
    } else {
        // 普通权限启动进程
        Command::new(&exe_path)
            .current_dir(&work_dir)
            .spawn()
            .map_err(|e| format!("普通模式启动修改器失败: {}", e))?;
    }

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

pub fn verify_record_exe_integrity(
    record: &crate::models::InstalledTrainerRecord,
    exe_path: &Path,
) -> Result<(), String> {
    if let Some(ref expected_hash) = record.exe_sha256 {
        let actual_hash = crate::services::downloader::compute_file_sha256(exe_path)?;
        if !expected_hash.eq_ignore_ascii_case(&actual_hash) {
            return Err(format!(
                "安全拦截：可执行文件完整性校验失败（{}），预期 SHA-256 为 {}，实际为 {}，疑似文件已被篡改，已阻止启动！",
                exe_path.display(),
                expected_hash,
                actual_hash
            ));
        }
    }
    Ok(())
}

pub fn delete_installed_trainer(id: &str) -> Result<(), String> {
    storage::delete_installed_trainer(id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::InstalledTrainerRecord;
    use std::collections::HashMap;
    use std::fs;

    fn sample_record(exe_path: &Path, exe_sha256: Option<String>) -> InstalledTrainerRecord {
        InstalledTrainerRecord {
            id: "test-trainer".to_string(),
            name: "Test Trainer".to_string(),
            chinese_name: None,
            version: "v1.0".to_string(),
            game_version: "".to_string(),
            exe_path: exe_path.to_string_lossy().to_string(),
            exe_name: "Test.exe".to_string(),
            install_dir: exe_path.parent().unwrap().to_string_lossy().to_string(),
            installed_at: "".to_string(),
            last_launched_at: None,
            steam_app_id: None,
            thumbnail: "".to_string(),
            hero_image: None,
            capsule_image: None,
            description: "".to_string(),
            options: vec![],
            option_items: vec![],
            saved_toggles: HashMap::new(),
            package_sha256: None,
            exe_sha256,
        }
    }

    #[test]
    fn test_verify_record_exe_integrity_blocks_tampered_binary() {
        let dir = std::env::temp_dir().join(format!(
            "fling_h1_launcher_test_{}_{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        let exe_path = dir.join("Test.exe");
        fs::write(&exe_path, b"MZoriginal-binary-payload").unwrap();

        let real_hash = crate::services::downloader::compute_file_sha256(&exe_path).unwrap();
        let record = sample_record(&exe_path, Some(real_hash));

        // 原始未篡改文件应校验通过
        assert!(verify_record_exe_integrity(&record, &exe_path).is_ok());

        // 模拟本地 EXE 被替换/篡改
        fs::write(&exe_path, b"MZtampered-evil-payload").unwrap();
        let err = verify_record_exe_integrity(&record, &exe_path).unwrap_err();
        assert!(err.contains("疑似文件已被篡改"));

        let _ = fs::remove_dir_all(&dir);
    }
}
