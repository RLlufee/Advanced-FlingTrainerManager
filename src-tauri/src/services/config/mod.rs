pub mod autostart;
pub mod io;
pub mod maintenance;
pub mod migrator;
pub mod models;
pub mod network;
pub mod preset;

pub use autostart::*;
pub use io::*;
pub use maintenance::*;
pub use migrator::*;
pub use models::*;
pub use network::*;
pub use preset::*;

#[cfg(test)]
mod wallpaper_config_tests {
    use super::ThemeSettings;

    #[test]
    fn older_theme_config_gets_wallpaper_defaults() {
        let theme: ThemeSettings = serde_json::from_str(
            r#"{"accent_color":"cyan","color_mode":"system","gradient_background":true}"#,
        )
        .expect("旧版主题配置应能继续读取");

        assert!(theme.wallpaper_images.is_empty());
        assert_eq!(theme.active_wallpaper_id, None);
        assert_eq!(theme.wallpaper_opacity, 65);
        assert_eq!(theme.wallpaper_blur, 0);
        assert_eq!(theme.wallpaper_fit, "cover");
        assert_eq!(theme.wallpaper_surface_transparency, 20);
    }
}
