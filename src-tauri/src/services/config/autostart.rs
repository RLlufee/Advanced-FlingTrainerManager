use super::io::{load_config, save_config};

/// 配置 Windows 开机自启
pub fn set_launch_at_startup(enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::*;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu
            .create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run")
            .map_err(|e| format!("打开开机自启注册表项失败: {}", e))?;

        let app_name = "AdvancedFlingTrainerManager";
        if enable {
            let exe = std::env::current_exe()
                .map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;
            let val = format!("\"{}\"", exe.to_string_lossy());
            key.set_value(app_name, &val)
                .map_err(|e| format!("写入开机自启注册表失败: {}", e))?;
        } else {
            match key.delete_value(app_name) {
                Ok(_) => {}
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                Err(e) => return Err(format!("删除开机自启注册表项失败: {}", e)),
            }
        }
    }

    let mut config = load_config();
    config.management.launch_at_startup = enable;
    save_config(&config)?;

    Ok(())
}
