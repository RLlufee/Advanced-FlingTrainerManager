pub mod commands;
pub mod models;
pub mod services;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
