/// 调起 Windows 原生系统文件夹选择对话框
pub fn pick_folder_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let output = std::process::Command::new("powershell")
            .args([
                "-STA",
                "-NoProfile",
                "-Command",
                "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = '请选择包含修改器的外部文件夹'; $f.ShowNewFolderButton = $false; $dummy = New-Object System.Windows.Forms.Form; $dummy.TopMost = $true; if($f.ShowDialog($dummy) -eq [System.Windows.Forms.DialogResult]::OK){ Write-Output $f.SelectedPath }",
            ])
            .output()
            .map_err(|e| format!("打开系统文件夹选择器失败: {}", e))?;

        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() {
            Ok(None)
        } else {
            Ok(Some(path))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(None)
    }
}
