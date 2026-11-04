use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 1. 热键与模拟引擎设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeySettings {
    /// 以管理员身份提权启动修改器 (默认 true)
    pub run_as_admin: bool,
    /// 模拟按键之间的间隔延迟 (毫秒，默认 100ms)
    pub key_interval_ms: u64,
    /// 单个按键按下的持续时长 (毫秒，默认 40ms)
    pub key_hold_ms: u64,
    /// 一键双启时自动模拟同步预设 (默认 true)
    pub auto_sync_on_double_launch: bool,
    /// 一键双启后延迟 N 秒执行模拟 (默认 3s)
    pub double_launch_delay_sec: u64,
    /// 模拟按键完成时显示浮窗提示 (默认 true)
    pub show_sync_toast: bool,
}

impl Default for HotkeySettings {
    fn default() -> Self {
        Self {
            run_as_admin: true,
            key_interval_ms: 100,
            key_hold_ms: 40,
            auto_sync_on_double_launch: true,
            double_launch_delay_sec: 3,
            show_sync_toast: true,
        }
    }
}

/// 2. 便携存储与文件管理设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagementSettings {
    pub custom_trainers_dir: Option<String>,
    pub auto_extract_zip: bool,
    pub scan_depth: u32,
    #[serde(default = "default_close_to_tray")]
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

pub fn default_close_to_tray() -> bool {
    false
}

impl Default for ManagementSettings {
    fn default() -> Self {
        Self {
            custom_trainers_dir: None,
            auto_extract_zip: true,
            scan_depth: 2,
            close_to_tray: false,
            launch_at_startup: false,
        }
    }
}

/// 3. 网络与加速源设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSettings {
    #[serde(default = "default_proxy_mode")]
    pub proxy_mode: String, // "system" | "custom" | "direct"
    #[serde(default = "default_proxy_url")]
    pub proxy_url: String, // e.g. "http://127.0.0.1:7890" or "socks5://127.0.0.1:7890"
    #[serde(default = "default_update_source")]
    pub update_source: String, // "official" | "ghproxy" | "mirror2"
    #[serde(default = "default_enable_steam_cdn")]
    pub enable_steam_cdn: bool,
    #[serde(default = "default_steam_cdn_host")]
    pub steam_cdn_host: String, // "shared.cloudflare.steamstatic.com" | "cdn.akamai.steamstatic.com"
    #[serde(default = "default_timeout_ms")]
    pub timeout_ms: u64, // 默认 8000ms
    #[serde(default = "default_max_retry_count")]
    pub max_retry_count: u32, // 默认 2
}

pub fn default_proxy_mode() -> String {
    "system".to_string()
}
pub fn default_proxy_url() -> String {
    "".to_string()
}
pub fn default_update_source() -> String {
    "official".to_string()
}
pub fn default_enable_steam_cdn() -> bool {
    true
}
pub fn default_steam_cdn_host() -> String {
    "shared.cloudflare.steamstatic.com".to_string()
}
pub fn default_timeout_ms() -> u64 {
    8000
}
pub fn default_max_retry_count() -> u32 {
    2
}

impl Default for NetworkSettings {
    fn default() -> Self {
        Self {
            proxy_mode: default_proxy_mode(),
            proxy_url: default_proxy_url(),
            update_source: default_update_source(),
            enable_steam_cdn: default_enable_steam_cdn(),
            steam_cdn_host: default_steam_cdn_host(),
            timeout_ms: default_timeout_ms(),
            max_retry_count: default_max_retry_count(),
        }
    }
}

/// 4. 界面与动效个性化设置 (参考 PCL-CE)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationSettings {
    #[serde(default = "default_anim_enabled")]
    pub enabled: bool,
    #[serde(default = "default_anim_speed_multiplier")]
    pub speed_multiplier: f64,
    #[serde(default = "default_anim_jelly_intensity")]
    pub jelly_intensity: String,
    #[serde(default = "default_anim_paper_flutter")]
    pub paper_flutter: bool,
    #[serde(default = "default_anim_magnetic_tabs")]
    pub magnetic_tabs: bool,
    #[serde(default = "default_anim_typewriter_speed")]
    pub typewriter_speed: u64,
    #[serde(default = "default_anim_tab_transition_duration")]
    pub tab_transition_duration: u64,
    #[serde(default = "default_anim_target_fps")]
    pub target_fps: u32,
}

pub fn default_anim_enabled() -> bool {
    true
}
pub fn default_anim_speed_multiplier() -> f64 {
    1.0
}
pub fn default_anim_jelly_intensity() -> String {
    "medium".to_string()
}
pub fn default_anim_paper_flutter() -> bool {
    true
}
pub fn default_anim_magnetic_tabs() -> bool {
    true
}
pub fn default_anim_typewriter_speed() -> u64 {
    18
}
pub fn default_anim_tab_transition_duration() -> u64 {
    180
}
pub fn default_anim_target_fps() -> u32 {
    144
}

impl Default for AnimationSettings {
    fn default() -> Self {
        Self {
            enabled: default_anim_enabled(),
            speed_multiplier: default_anim_speed_multiplier(),
            jelly_intensity: default_anim_jelly_intensity(),
            paper_flutter: default_anim_paper_flutter(),
            magnetic_tabs: default_anim_magnetic_tabs(),
            typewriter_speed: default_anim_typewriter_speed(),
            tab_transition_duration: default_anim_tab_transition_duration(),
            target_fps: default_anim_target_fps(),
        }
    }
}

pub fn default_theme_accent() -> String {
    "cyan".to_string()
}
pub fn default_color_mode() -> String {
    "system".to_string()
}
pub fn default_gradient_background() -> bool {
    true
}
pub fn default_wallpaper_opacity() -> u16 {
    65
}
pub fn default_wallpaper_blur() -> u16 {
    0
}
pub fn default_wallpaper_fit() -> String {
    "cover".to_string()
}
pub fn default_wallpaper_surface_transparency() -> u16 {
    20
}
pub fn default_wallpaper_enabled() -> bool {
    true
}
pub fn default_layer_true() -> bool {
    true
}
pub fn default_card_opacity() -> u16 {
    80
}
pub fn default_sidebar_opacity() -> u16 {
    75
}
pub fn default_backdrop_blur() -> u16 {
    12
}

/// 自定义壁纸图层覆盖与游乐场调试配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WallpaperLayersConfig {
    /// 侧边栏导航层
    #[serde(default = "default_layer_true")]
    pub sidebar: bool,
    /// 主工作区底衬
    #[serde(default = "default_layer_true")]
    pub content: bool,
    /// 卡片容器层
    #[serde(default)]
    pub cards: bool,
    /// 顶部标题栏
    #[serde(default)]
    pub titlebar: bool,
    /// 模态浮层
    #[serde(default)]
    pub modals: bool,
    /// 卡片不透明度 (30-100)
    #[serde(default = "default_card_opacity")]
    pub card_opacity: u16,
    /// 侧栏不透明度 (30-100)
    #[serde(default = "default_sidebar_opacity")]
    pub sidebar_opacity: u16,
    /// 毛玻璃模糊度 (0-24px)
    #[serde(default = "default_backdrop_blur")]
    pub backdrop_blur: u16,
}

impl Default for WallpaperLayersConfig {
    fn default() -> Self {
        Self {
            sidebar: true,
            content: true,
            cards: false,
            titlebar: false,
            modals: false,
            card_opacity: default_card_opacity(),
            sidebar_opacity: default_sidebar_opacity(),
            backdrop_blur: default_backdrop_blur(),
        }
    }
}

pub fn default_dynamic_source() -> String {
    "windows".to_string()
}

/// 莫奈动态取色持久化自定义图片条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonetSavedImage {
    pub id: String,
    pub name: String,
    /// 保存在 app_data/theme_wallpapers/ 下的缩略图绝对路径
    pub image_path: String,
    /// Google Monet 算法量化评分提取出的多枚候选色号
    pub palette: Vec<String>,
    /// 用户在该图片下当前选定的色号
    pub selected_hex: String,
    pub added_at: String,
}

/// 用户导入并保存在应用数据目录中的自定义界面壁纸
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WallpaperSavedImage {
    pub id: String,
    pub name: String,
    pub image_path: String,
    pub added_at: String,
}

/// 主题与个性化外观配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSettings {
    #[serde(default = "default_theme_accent")]
    pub accent_color: String,
    pub custom_accent_hex: Option<String>,
    #[serde(default = "default_color_mode")]
    pub color_mode: String,
    /// 是否启用随主题强调色变化的主界面渐变背景
    #[serde(default = "default_gradient_background")]
    pub gradient_background: bool,
    /// 动态取色模式下的激活源: "windows" | "image"
    #[serde(default = "default_dynamic_source")]
    pub dynamic_source: String,
    /// 持久化保存的莫奈自定义取色图片画廊
    #[serde(default)]
    pub monet_saved_images: Vec<MonetSavedImage>,
    /// 当前激活的莫奈取色图片 ID
    #[serde(default)]
    pub active_monet_image_id: Option<String>,
    /// 动态取色最近一次生效的种子色号 (保证冷启动 0ms 无闪烁还原)
    #[serde(default)]
    pub dynamic_seed_hex: Option<String>,
    /// 高级选项：启动页选中修改器时跟随游戏封面动态变色
    #[serde(default)]
    pub game_adaptive_accent: bool,
    #[serde(default)]
    pub wallpaper_images: Vec<WallpaperSavedImage>,
    #[serde(default)]
    pub active_wallpaper_id: Option<String>,
    #[serde(default = "default_wallpaper_opacity")]
    pub wallpaper_opacity: u16,
    #[serde(default = "default_wallpaper_blur")]
    pub wallpaper_blur: u16,
    #[serde(default = "default_wallpaper_fit")]
    pub wallpaper_fit: String,
    #[serde(default = "default_wallpaper_surface_transparency")]
    pub wallpaper_surface_transparency: u16,
    #[serde(default = "default_wallpaper_enabled")]
    pub wallpaper_enabled: bool,
    #[serde(default)]
    pub wallpaper_layers: WallpaperLayersConfig,
}

impl Default for ThemeSettings {
    fn default() -> Self {
        Self {
            accent_color: default_theme_accent(),
            custom_accent_hex: None,
            color_mode: default_color_mode(),
            gradient_background: default_gradient_background(),
            dynamic_source: default_dynamic_source(),
            monet_saved_images: Vec::new(),
            active_monet_image_id: None,
            dynamic_seed_hex: None,
            game_adaptive_accent: false,
            wallpaper_images: Vec::new(),
            active_wallpaper_id: None,
            wallpaper_opacity: default_wallpaper_opacity(),
            wallpaper_blur: default_wallpaper_blur(),
            wallpaper_fit: default_wallpaper_fit(),
            wallpaper_surface_transparency: default_wallpaper_surface_transparency(),
            wallpaper_enabled: default_wallpaper_enabled(),
            wallpaper_layers: WallpaperLayersConfig::default(),
        }
    }
}

/// 全局应用程序配置实体
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppConfig {
    pub hotkey: HotkeySettings,
    pub management: ManagementSettings,
    pub network: NetworkSettings,
    #[serde(default)]
    pub animation: AnimationSettings,
    #[serde(default)]
    pub theme: ThemeSettings,
}

/// 预设备份单项实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainerPresetBackupItem {
    pub id: String,
    pub name: String,
    pub chinese_name: Option<String>,
    pub saved_toggles: HashMap<String, bool>,
}

/// 存储与缓存统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub trainers_dir: String,
    pub trainers_count: usize,
    pub total_size_bytes: u64,
    pub cover_cache_size_bytes: u64,
    pub cover_cache_count: usize,
    pub offline_dict_count: usize,
}

/// 缓存清理结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanSummary {
    pub cleaned_files_count: usize,
    pub freed_bytes: u64,
}

/// 网络连通性测试结果实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkTestResult {
    pub success: bool,
    pub target_url: String,
    pub status_code: Option<u16>,
    pub latency_ms: u64,
    pub message: String,
}
