use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub name: String,
    pub driver_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeInfo {
    pub id: String,
    pub size_bytes: u64,
    pub free_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareOverview {
    pub manufacturer: String,
    pub model: String,
    pub os: String,
    pub build: String,
    pub cpu: String,
    pub cores: u32,
    pub threads: u32,
    pub ram_total: u64,
    pub ram_free: u64,
    pub gpus: Vec<GpuInfo>,
    pub volumes: Vec<VolumeInfo>,
    pub mainboard: String,
    pub bios: String,
    pub boot_at: Option<i64>,
}

#[cfg(target_os = "windows")]
pub fn collect_hardware_overview() -> Result<HardwareOverview, String> {
    use std::os::windows::process::CommandExt;

    // 单次只读 PowerShell CIM 脚本，避免 UI 阻塞和多次 WMI COM 调度
    const SCRIPT: &str = r#"
$ErrorActionPreference = 'SilentlyContinue'
function Epoch($value) {
  if ($null -eq $value) { return $null }
  try { return [long](($value).ToUniversalTime().Subtract([DateTime]'1970-01-01').TotalMilliseconds) } catch { return $null }
}
$computer = Get-CimInstance Win32_ComputerSystem
$system = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$board = Get-CimInstance Win32_BaseBoard | Select-Object -First 1
$bios = Get-CimInstance Win32_BIOS | Select-Object -First 1
$gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object {
  [ordered]@{ name = [string]$_.Name; driver_version = [string]$_.DriverVersion }
})
$volumes = @(Get-CimInstance Win32_LogicalDisk -Filter 'DriveType = 3' | ForEach-Object {
  [ordered]@{ id = [string]$_.DeviceID; size_bytes = [Int64]$_.Size; free_bytes = [Int64]$_.FreeSpace }
})
[ordered]@{
  manufacturer = [string]$computer.Manufacturer
  model = [string]$computer.Model
  os = [string]$system.Caption
  build = [string]$system.BuildNumber
  cpu = [string]$cpu.Name
  cores = [int]$cpu.NumberOfCores
  threads = [int]$cpu.NumberOfLogicalProcessors
  ram_total = [Int64]$computer.TotalPhysicalMemory
  ram_free = [Int64]$system.FreePhysicalMemory * 1024
  gpus = $gpus
  volumes = $volumes
  mainboard = if ($board.Product) { [string]$board.Product } else { [string]$board.Manufacturer }
  bios = [string]$bios.SMBIOSBIOSVersion
  boot_at = Epoch $system.LastBootUpTime
} | ConvertTo-Json -Depth 4 -Compress
"#;

    let output = std::process::Command::new("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            SCRIPT,
        ])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW
        .output()
        .map_err(|e| format!("执行 PowerShell 硬件采集失败: {}", e))?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr);
        return Err(format!("硬件信息查询失败: {}", err));
    }

    let json_str = String::from_utf8_lossy(&output.stdout);
    let trimmed = json_str.trim();
    if trimmed.is_empty() {
        return Err("硬件信息查询结果为空".to_string());
    }

    serde_json::from_str::<HardwareOverview>(trimmed)
        .map_err(|e| format!("解析硬件 JSON 结构失败: {}, 原文本: {}", e, trimmed))
}

#[cfg(not(target_os = "windows"))]
pub fn collect_hardware_overview() -> Result<HardwareOverview, String> {
    Err("硬件全景检测目前仅支持 Windows 系统".to_string())
}
