use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, Position,
};

/// 初始化系统托盘图标并预建轻量亚克力托盘弹窗
pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // 1. 创建现代毛玻璃小托盘窗口 (Webview: ?view=tray)
    let _popup = tauri::WebviewWindowBuilder::new(
        app,
        "tray_popup",
        tauri::WebviewUrl::App("index.html?view=tray".into()),
    )
    .title("FlingTrainer Tray")
    .inner_size(260.0, 320.0)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)
    .shadow(false)
    .build()?;

    // 2. 构造托盘图标实例（不绑定 Win32 原生黑框菜单，改由右键呼出毛玻璃小窗）
    let mut builder = TrayIconBuilder::with_id("main-tray")
        .tooltip("Advanced FlingTrainerManager")
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| match event {
            // 左键单击：唤醒并置顶主窗口
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                if let Some(popup) = tray.app_handle().get_webview_window("tray_popup") {
                    let _ = popup.hide();
                }
                show_main_window(tray.app_handle());
            }
            // 右键单击：在托盘上方弹出极具现代感、跟随莫奈强调色的专属小托盘面板
            TrayIconEvent::Click {
                button: MouseButton::Right,
                button_state: MouseButtonState::Up,
                position,
                ..
            } => {
                toggle_tray_popup(tray.app_handle(), position);
            }
            _ => {}
        });

    // 优先加载直接内嵌的 32x32 专属高清图标字节，彻底摆脱 Windows 资源缓存或 dev 增量编译导致的旧图标问题
    let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../../icons/32x32.png"))
        .ok()
        .or_else(|| app.default_window_icon().cloned());

    if let Some(icon) = tray_icon {
        builder = builder.icon(icon);
    }

    builder.build(app)?;

    Ok(())
}

/// 切换或弹出专属毛玻璃托盘小窗，并根据点击物理坐标精准对齐任务栏托盘
pub fn toggle_tray_popup(app: &AppHandle, click_pos: PhysicalPosition<f64>) {
    if let Some(popup) = app.get_webview_window("tray_popup") {
        if popup.is_visible().unwrap_or(false) {
            let _ = popup.hide();
            return;
        }

        let popup_width = 260.0;
        let popup_height = 320.0;

        let (target_x, target_y) = if let Ok(Some(monitor)) = popup.current_monitor() {
            let scale_factor = monitor.scale_factor();
            let screen_size = monitor.size();
            let phys_w = popup_width * scale_factor;
            let phys_h = popup_height * scale_factor;

            // X 轴：以点击处为水平中心，并施加屏幕安全边界保护（左右预留 12px 边距）
            let mut x = click_pos.x - (phys_w / 2.0);
            let max_x = screen_size.width as f64 - phys_w - 12.0;
            if x > max_x {
                x = max_x;
            }
            if x < 12.0 {
                x = 12.0;
            }

            // Y 轴：默认在点击点（任务栏托盘区域）上方预留 12px 缝隙
            let mut y = click_pos.y - phys_h - 12.0;
            if y < 12.0 {
                // 若任务栏在屏幕上方
                y = click_pos.y + 24.0;
            }

            (x, y)
        } else {
            (click_pos.x - 130.0, click_pos.y - 330.0)
        };

        let _ = popup.set_position(Position::Physical(PhysicalPosition {
            x: target_x as i32,
            y: target_y as i32,
        }));
        let _ = popup.show();
        let _ = popup.set_focus();
    }
}

/// 唤醒并置顶显示主窗口（并隐藏托盘弹窗）
pub fn show_main_window(app: &AppHandle) {
    if let Some(popup) = app.get_webview_window("tray_popup") {
        let _ = popup.hide();
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// 退出程序
pub fn quit_app(app: &AppHandle) {
    app.exit(0);
}

/// 判断当前设置是否应拦截关闭请求并隐藏至托盘
pub fn should_close_to_tray(close_to_tray_setting: bool) -> bool {
    close_to_tray_setting
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::config::ManagementSettings;

    #[test]
    fn test_tray_close_behavior_default() {
        let mgmt = ManagementSettings::default();
        // 用户需求：默认关闭最小化到系统托盘
        assert!(!mgmt.close_to_tray, "默认必须关闭最小化到系统托盘");
        assert!(!should_close_to_tray(mgmt.close_to_tray));
    }

    #[test]
    fn test_tray_close_behavior_when_enabled() {
        let mut mgmt = ManagementSettings::default();
        mgmt.close_to_tray = true;
        assert!(should_close_to_tray(mgmt.close_to_tray), "手动开启后应当拦截关闭并最小化到托盘");
    }
}
