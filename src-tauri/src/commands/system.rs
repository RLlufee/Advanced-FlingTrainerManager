use crate::services::{frame_rate, hardware_inspector, memory_optimizer, system_cleaner};

#[tauri::command]
pub fn get_system_memory_info() -> Result<memory_optimizer::SystemMemoryInfo, String> {
    memory_optimizer::get_system_memory_info()
}

#[tauri::command]
pub async fn optimize_memory(
    options: Option<memory_optimizer::MemoryOptimizeOptions>,
) -> Result<memory_optimizer::MemoryOptimizeResult, String> {
    tokio::task::spawn_blocking(move || memory_optimizer::optimize_memory(options))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn restart_app_as_admin(app: tauri::AppHandle) -> Result<(), String> {
    memory_optimizer::restart_as_admin_with_cleanup(|| {
        let _ = app.remove_tray_by_id("main-tray");
        crate::services::single_instance::release_active_guard();
    })
}

/// 显示器刷新率与本次启动的帧率模式，供设置页判断切换档位后是否需要重启
#[tauri::command]
pub fn get_frame_rate_status() -> frame_rate::FrameRateStatus {
    frame_rate::status()
}

/// 以当前权限重新启动应用（用于让新的 WebView2 启动参数生效）
#[tauri::command]
pub fn restart_app(app: tauri::AppHandle) -> Result<(), String> {
    let exe_path =
        std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;
    std::process::Command::new(&exe_path)
        .arg(crate::services::single_instance::RELAUNCH_WAIT_PID_ARG)
        .arg(std::process::id().to_string())
        .spawn()
        .map_err(|e| format!("重新启动失败: {}", e))?;
    // 新进程会等待本进程退出后再接管单实例锁；先释放托盘图标与锁再退出
    let _ = app.remove_tray_by_id("main-tray");
    crate::services::single_instance::release_active_guard();
    std::process::exit(0);
}

#[tauri::command]
pub fn open_system_tool(tool: String) -> Result<(), String> {
    memory_optimizer::open_system_tool(&tool)
}

#[tauri::command]
pub async fn get_hardware_overview() -> Result<hardware_inspector::HardwareOverview, String> {
    tokio::task::spawn_blocking(hardware_inspector::collect_hardware_overview)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn system_cleanup_scan() -> Result<system_cleaner::CleanupScanResult, String> {
    tokio::task::spawn_blocking(system_cleaner::scan_system_cleanup)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn system_cleanup_run(
    categories: Vec<String>,
) -> Result<system_cleaner::CleanupRunResult, String> {
    tokio::task::spawn_blocking(move || system_cleaner::run_system_cleanup(categories))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn show_main_window(app: tauri::AppHandle) {
    crate::services::tray::show_main_window(&app);
}

#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    crate::services::tray::quit_app(&app);
}
