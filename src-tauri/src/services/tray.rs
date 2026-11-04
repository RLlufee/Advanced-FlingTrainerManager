use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

/// 初始化系统托盘与上下文菜单
pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出程序", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &sep, &quit_item])?;

    let mut builder = TrayIconBuilder::with_id("main-tray")
        .tooltip("Advanced FlingTrainerManager")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                show_main_window(app);
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;

    Ok(())
}

/// 唤醒并置顶显示主窗口
pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
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
        assert!(mgmt.close_to_tray, "默认必须启用关闭最小化到系统托盘");
        assert!(should_close_to_tray(mgmt.close_to_tray));
    }

    #[test]
    fn test_tray_close_behavior_when_disabled() {
        let mut mgmt = ManagementSettings::default();
        mgmt.close_to_tray = false;
        assert!(!should_close_to_tray(mgmt.close_to_tray));
    }
}
