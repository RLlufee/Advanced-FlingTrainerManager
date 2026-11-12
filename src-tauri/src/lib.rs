pub mod commands;
pub mod models;
pub mod services;

use commands::*;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let wait_pid = services::single_instance::parse_relaunch_wait_pid();
    match services::single_instance::acquire_or_notify(wait_pid) {
        services::single_instance::AcquireOutcome::Primary(guard) => {
            services::single_instance::set_active_guard(guard);
        }
        services::single_instance::AcquireOutcome::SecondaryNotified => {
            // 已有运行中的主实例（含托盘驻留态），已发送唤醒信号，当前次级进程直接退出
            return;
        }
    }
    let _single_instance_scope = services::single_instance::ActiveGuardScope;

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 初始化系统托盘图标与上下文菜单
            services::tray::setup_tray(app.handle())?;

            // 启动单实例唤醒监听：当重复打开程序时在主线程唤醒并置顶已存在的主窗口
            let app_handle = app.handle().clone();
            services::single_instance::start_active_wakeup_listener(move || {
                let handle_for_main = app_handle.clone();
                let _ = app_handle.run_on_main_thread(move || {
                    services::tray::show_main_window(&handle_for_main);
                });
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // 托盘小窗失焦时自动隐藏（达到原生无感收缩）
            if let tauri::WindowEvent::Focused(false) = event {
                if window.label() == "tray_popup" {
                    let _ = window.hide();
                }
            }
            // 拦截主窗口关闭请求：若开启“最小化到托盘”则隐藏主窗口；否则显式退出应用（避免隐藏的 tray_popup 导致进程残留）
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let config = services::config::load_config();
                    if services::tray::should_close_to_tray(config.management.close_to_tray) {
                        api.prevent_close();
                        let _ = window.hide();
                    } else {
                        services::tray::quit_app(window.app_handle());
                    }
                } else if window.label() == "tray_popup" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Trainer & Launcher Commands
            fetch_trainers,
            search_trainers,
            get_trainer_detail,
            download_trainer,
            get_installed_trainers,
            launch_trainer,
            launch_steam_game,
            open_steam_store,
            open_install_dir,
            open_trainers_root,
            delete_installed_trainer,
            launch_game_and_trainer,
            save_trainer_toggles,
            sync_trainer_hotkeys,
            check_trainers_update,
            update_trainer_to_latest,
            // Importer Commands
            pick_external_folder,
            scan_and_import_trainers,
            enrich_installed_trainer,
            enrich_all_installed_trainers,
            // Config & Presets Commands
            get_app_config,
            save_app_config,
            export_all_presets,
            import_all_presets,
            clear_all_presets,
            get_storage_stats,
            clean_orphan_cache,
            migrate_trainers_dir,
            resolve_trainers_target_dir,
            switch_trainers_dir,
            set_launch_at_startup,
            test_network_connectivity,
            // System Diagnostics & Cleanup Commands
            get_system_memory_info,
            optimize_memory,
            restart_app_as_admin,
            open_system_tool,
            get_hardware_overview,
            system_cleanup_scan,
            system_cleanup_run,
            show_main_window,
            quit_app,
            // Wallpaper & Monet Accent Commands
            get_windows_accent_color,
            save_monet_wallpaper_thumbnail,
            delete_monet_wallpaper_file,
            read_image_as_data_url,
            save_custom_wallpaper,
            import_custom_wallpaper,
            delete_custom_wallpaper
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
