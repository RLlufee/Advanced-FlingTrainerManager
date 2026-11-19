// 全局纯窗口子系统（无论 Debug 还是 Release 模式均彻底消除 Windows 控制台黑框）
#![windows_subsystem = "windows"]

fn main() {
    // WebView2 默认即按显示器刷新率同步出帧（并不存在 60 Hz 锁频）。仅当用户选择「无上限」或
    // 高于显示器刷新率的档位时才关闭垂直同步，详见 services::frame_rate。
    #[cfg(target_os = "windows")]
    unsafe {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            app_lib::services::frame_rate::webview_browser_args(),
        );
    }

    app_lib::run()
}
