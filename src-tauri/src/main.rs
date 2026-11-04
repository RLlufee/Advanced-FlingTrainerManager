// 全局纯窗口子系统（无论 Debug 还是 Release 模式均彻底消除 Windows 控制台黑框）
#![windows_subsystem = "windows"]

fn main() {
    // 解除 Windows WebView2 默认的 60Hz 节能锁频限制，解锁 120Hz/144Hz/240Hz+ 满血电竞高刷与 GPU 硬件栅格化加速
    #[cfg(target_os = "windows")]
    unsafe {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-frame-rate-limit --enable-gpu-rasterization --ignore-gpu-blocklist",
        );
    }

    app_lib::run()
}
