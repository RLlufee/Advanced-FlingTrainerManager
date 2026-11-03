use crate::services::storage::{
    self, get_app_data_dir, load_installed_records, save_installed_record,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

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

/// 2. 便携存储与文件管理设置 (预留给第二步)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagementSettings {
    pub custom_trainers_dir: Option<String>,
    pub auto_extract_zip: bool,
    pub scan_depth: u32,
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

impl Default for ManagementSettings {
    fn default() -> Self {
        Self {
            custom_trainers_dir: None,
            auto_extract_zip: true,
            scan_depth: 2,
            close_to_tray: true,
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

fn default_proxy_mode() -> String {
    "system".to_string()
}
fn default_proxy_url() -> String {
    "".to_string()
}
fn default_update_source() -> String {
    "official".to_string()
}
fn default_enable_steam_cdn() -> bool {
    true
}
fn default_steam_cdn_host() -> String {
    "shared.cloudflare.steamstatic.com".to_string()
}
fn default_timeout_ms() -> u64 {
    8000
}
fn default_max_retry_count() -> u32 {
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
}

fn default_anim_enabled() -> bool {
    true
}
fn default_anim_speed_multiplier() -> f64 {
    1.0
}
fn default_anim_jelly_intensity() -> String {
    "medium".to_string()
}
fn default_anim_paper_flutter() -> bool {
    true
}
fn default_anim_magnetic_tabs() -> bool {
    true
}
fn default_anim_typewriter_speed() -> u64 {
    18
}

fn default_theme_accent() -> String {
    "cyan".to_string()
}
fn default_color_mode() -> String {
    "system".to_string()
}
fn default_gradient_background() -> bool {
    true
}
fn default_wallpaper_opacity() -> u16 {
    65
}
fn default_wallpaper_blur() -> u16 {
    0
}
fn default_wallpaper_fit() -> String {
    "cover".to_string()
}
fn default_wallpaper_surface_transparency() -> u16 {
    20
}
fn default_wallpaper_enabled() -> bool {
    true
}
fn default_layer_true() -> bool {
    true
}
fn default_card_opacity() -> u16 {
    80
}
fn default_sidebar_opacity() -> u16 {
    75
}
fn default_backdrop_blur() -> u16 {
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

fn default_dynamic_source() -> String {
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

impl Default for AnimationSettings {
    fn default() -> Self {
        Self {
            enabled: default_anim_enabled(),
            speed_multiplier: default_anim_speed_multiplier(),
            jelly_intensity: default_anim_jelly_intensity(),
            paper_flutter: default_anim_paper_flutter(),
            magnetic_tabs: default_anim_magnetic_tabs(),
            typewriter_speed: default_anim_typewriter_speed(),
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

fn get_config_file_path() -> PathBuf {
    get_app_data_dir().join("app_config.json")
}

/// 原子安全写盘辅助函数（写入临时文件、强制刷盘后再原子替换，防止断电或并发导致空文件/半成品）
pub fn atomic_write_file(path: &std::path::Path, content: &[u8]) -> Result<(), String> {
    use std::io::Write;
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let tmp_path = path.with_extension(format!("tmp.{}", std::process::id()));
    {
        let mut file =
            fs::File::create(&tmp_path).map_err(|e| format!("创建临时文件失败: {}", e))?;
        file.write_all(content)
            .map_err(|e| format!("写入临时文件失败: {}", e))?;
        file.flush()
            .map_err(|e| format!("刷盘临时文件失败: {}", e))?;
        let _ = file.sync_all();
    }
    if fs::rename(&tmp_path, path).is_err() {
        fs::copy(&tmp_path, path).map_err(|e| format!("原子替换目标文件失败: {}", e))?;
        let _ = fs::remove_file(&tmp_path);
    }
    Ok(())
}

/// 读取应用全局配置，若不存在则生成默认配置；若存在但损坏则安全隔离备份，绝不静默覆盖
pub fn load_config() -> AppConfig {
    let file = get_config_file_path();
    if file.exists()
        && let Ok(content) = fs::read_to_string(&file)
    {
        match serde_json::from_str::<AppConfig>(&content) {
            Ok(config) => return config,
            Err(e) => {
                // 配置损坏安全防线：备份损坏的原配置文件，保留用户历史与排查证据
                if let Some(parent) = file.parent() {
                    let corrupt_backup = parent.join(format!(
                        "app_config.corrupt.{}.json",
                        chrono::Utc::now().timestamp()
                    ));
                    let _ = fs::copy(&file, &corrupt_backup);
                    eprintln!(
                        "全局配置文件 {:?} 解析损坏，已自动备份至 {:?}: {}",
                        file, corrupt_backup, e
                    );
                }
            }
        }
    }
    let default_config = AppConfig::default();
    let _ = save_config(&default_config);
    default_config
}

/// 保存应用全局配置（原子替换落盘）
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let file = get_config_file_path();
    let json =
        serde_json::to_string_pretty(config).map_err(|e| format!("序列化配置失败: {}", e))?;
    atomic_write_file(&file, json.as_bytes())
}

/// 预设备份单项实体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainerPresetBackupItem {
    pub id: String,
    pub name: String,
    pub chinese_name: Option<String>,
    pub saved_toggles: HashMap<String, bool>,
}

/// 导出所有已安装修改器的开关预设为 JSON
pub fn export_all_presets() -> Result<String, String> {
    let records = load_installed_records();
    let items: Vec<TrainerPresetBackupItem> = records
        .into_iter()
        .filter(|r| !r.saved_toggles.is_empty())
        .map(|r| TrainerPresetBackupItem {
            id: r.id,
            name: r.name,
            chinese_name: r.chinese_name,
            saved_toggles: r.saved_toggles,
        })
        .collect();

    serde_json::to_string_pretty(&items).map_err(|e| format!("导出预设序列化失败: {}", e))
}

/// 从 JSON 恢复导入所有修改器的预设（严格核验写盘结果，写盘失败不计入成功）
pub fn import_all_presets(json_str: &str) -> Result<u32, String> {
    let items: Vec<TrainerPresetBackupItem> = serde_json::from_str(json_str)
        .map_err(|e| format!("导入预设解析失败，请确保格式正确: {}", e))?;

    let mut records = load_installed_records();
    let mut updated_count = 0u32;

    for item in items {
        if let Some(record) = records
            .iter_mut()
            .find(|r| r.id == item.id || r.name == item.name)
        {
            record.saved_toggles = item.saved_toggles;
            if let Err(e) = save_installed_record(record.clone()) {
                eprintln!("预设落盘失败 [{}]: {}", record.id, e);
                continue;
            }
            updated_count += 1;
        }
    }

    Ok(updated_count)
}

/// 清空所有已安装修改器的开关预设（严格核验写盘结果）
pub fn clear_all_presets() -> Result<u32, String> {
    let mut records = load_installed_records();
    let mut cleared_count = 0u32;

    for record in records.iter_mut() {
        if !record.saved_toggles.is_empty() {
            record.saved_toggles.clear();
            if let Err(e) = save_installed_record(record.clone()) {
                eprintln!("清空预设写盘失败 [{}]: {}", record.id, e);
                continue;
            }
            cleared_count += 1;
        }
    }

    Ok(cleared_count)
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

/// 获取存储与缓存统计信息
pub fn get_storage_stats() -> Result<StorageStats, String> {
    let trainers_dir = storage::get_trainers_dir();
    let records = load_installed_records();

    let mut total_size_bytes = 0u64;
    let mut cover_cache_size_bytes = 0u64;
    let mut cover_cache_count = 0usize;

    // 递归统计 trainers 目录
    if trainers_dir.exists()
        && let Ok(entries) = fs::read_dir(&trainers_dir)
    {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir()
                && let Ok(sub_entries) = fs::read_dir(&p)
            {
                for sub in sub_entries.flatten() {
                    let sp = sub.path();
                    if let Ok(meta) = sp.metadata() {
                        let len = meta.len();
                        total_size_bytes += len;

                        let file_name = sp
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_lowercase();
                        if file_name == "cover.jpg" || file_name == "cover.png" {
                            cover_cache_size_bytes += len;
                            cover_cache_count += 1;
                        }
                    }
                }
            }
        }
    }

    let offline_dict_count = crate::services::game_meta::get_offline_dictionary_count();

    Ok(StorageStats {
        trainers_dir: trainers_dir.to_string_lossy().to_string(),
        trainers_count: records.len(),
        total_size_bytes,
        cover_cache_size_bytes,
        cover_cache_count,
        offline_dict_count,
    })
}

/// 清理孤立缓存与临时解压文件
pub fn clean_orphan_cache() -> Result<CleanSummary, String> {
    let mut cleaned_files_count = 0usize;
    let mut freed_bytes = 0u64;

    // 清理以 fling_import_tmp 开头的临时解压目录与文件
    let temp_dir = std::env::temp_dir();
    if let Ok(entries) = fs::read_dir(&temp_dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            let file_name = p.file_name().unwrap_or_default().to_string_lossy();
            if file_name.starts_with("fling_import_tmp") {
                if p.is_dir() {
                    if let Ok(sub_entries) = fs::read_dir(&p) {
                        for sub in sub_entries.flatten() {
                            let sp = sub.path();
                            if sp.is_file()
                                && let Ok(meta) = sp.metadata()
                            {
                                let len = meta.len();
                                if fs::remove_file(&sp).is_ok() {
                                    freed_bytes += len;
                                    cleaned_files_count += 1;
                                }
                            }
                        }
                    }
                    let _ = fs::remove_dir_all(&p);
                } else if p.is_file()
                    && let Ok(meta) = p.metadata()
                {
                    let len = meta.len();
                    if fs::remove_file(&p).is_ok() {
                        freed_bytes += len;
                        cleaned_files_count += 1;
                    }
                }
            }
        }
    }

    Ok(CleanSummary {
        cleaned_files_count,
        freed_bytes,
    })
}

/// 将修改器目录从指定源目录迁移至目标目录（具备路径拓扑校验、冲突预检、跨盘回退与失败事务回滚）
pub fn migrate_trainers_dir_from_to(
    current_dir: &std::path::Path,
    new_dir_str: &str,
    persist_config: bool,
) -> Result<u32, String> {
    let trimmed = new_dir_str.trim();
    if trimmed.is_empty() {
        return Err("目标目录路径不能为空".to_string());
    }

    let target_raw_path = PathBuf::from(trimmed);
    // 确保目标目录已创建，以便获取其规范化绝对路径
    fs::create_dir_all(&target_raw_path).map_err(|e| format!("创建目标目录失败: {}", e))?;

    if !current_dir.exists() {
        fs::create_dir_all(current_dir).map_err(|e| format!("创建当前存储目录失败: {}", e))?;
    }

    let canon_current =
        fs::canonicalize(current_dir).map_err(|e| format!("解析当前存储路径失败: {}", e))?;
    let canon_target =
        fs::canonicalize(&target_raw_path).map_err(|e| format!("解析目标存储路径失败: {}", e))?;

    // 1. 拓扑与边界安全检查
    if canon_current == canon_target {
        return Err("目标路径与当前存储路径相同，无需迁移".to_string());
    }
    if canon_target.starts_with(&canon_current) {
        return Err("安全拦截：目标路径不能位于当前存储路径内部，防止循环递归嵌套".to_string());
    }
    if canon_current.starts_with(&canon_target) {
        return Err("安全拦截：当前存储路径不能位于目标路径内部，防止文件冲突与覆盖".to_string());
    }

    // 2. 预检扫描：收集所有需迁移的子目录，并检测冲突
    let entries =
        fs::read_dir(&canon_current).map_err(|e| format!("读取当前存储目录失败: {}", e))?;

    let mut to_migrate: Vec<(PathBuf, PathBuf, std::ffi::OsString)> = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let folder_name = entry.file_name();
            let new_game_dir = canon_target.join(&folder_name);
            // 目标目录已有同名目录，拒绝静默覆盖
            if new_game_dir.exists() {
                return Err(format!(
                    "目标目录中已存在同名修改器文件夹 '{}'，为防止文件覆盖已中止迁移",
                    folder_name.to_string_lossy()
                ));
            }
            to_migrate.push((path, new_game_dir, folder_name));
        }
    }

    // 若当前没有任何已安装修改器目录，直接更新配置为新目录并返回 0
    if to_migrate.is_empty() {
        if persist_config {
            let clean_target = storage::strip_verbatim_prefix(&canon_target);
            let mut config = load_config();
            config.management.custom_trainers_dir =
                Some(clean_target.to_string_lossy().to_string());
            save_config(&config)?;
        }
        return Ok(0);
    }

    // 3. 执行迁移与事务回滚记录
    enum RollbackAction {
        RenameBack { from: PathBuf, to: PathBuf },
        RemoveTargetDir(PathBuf),
    }

    let mut rollback_stack: Vec<RollbackAction> = Vec::new();
    let mut copied_sources_to_clean: Vec<PathBuf> = Vec::new();

    let mut migration_exec = || -> Result<u32, String> {
        let mut count = 0u32;
        for (old_game_dir, new_game_dir, folder_name) in &to_migrate {
            let folder_display = folder_name.to_string_lossy();

            // 优先尝试同盘快速重命名 rename，失败时降级为跨盘 copy_dir_all
            if fs::rename(old_game_dir, new_game_dir).is_ok() {
                rollback_stack.push(RollbackAction::RenameBack {
                    from: new_game_dir.clone(),
                    to: old_game_dir.clone(),
                });
            } else {
                if let Err(e) = copy_dir_all(old_game_dir, new_game_dir) {
                    let _ = fs::remove_dir_all(new_game_dir);
                    return Err(format!(
                        "跨盘复制修改器文件夹 '{}' 失败: {}",
                        folder_display, e
                    ));
                }
                rollback_stack.push(RollbackAction::RemoveTargetDir(new_game_dir.clone()));
                copied_sources_to_clean.push(old_game_dir.clone());
            }

            // 更新新目录下的 trainer.json
            let info_file = new_game_dir.join("trainer.json");
            if info_file.exists() {
                let content = fs::read_to_string(&info_file).map_err(|e| {
                    format!(
                        "读取新目录 '{}' 中的 trainer.json 失败: {}",
                        folder_display, e
                    )
                })?;
                let mut record: crate::models::InstalledTrainerRecord =
                    serde_json::from_str(&content).map_err(|e| {
                        format!(
                            "解析新目录 '{}' 中的 trainer.json 失败: {}",
                            folder_display, e
                        )
                    })?;

                let clean_new_game_dir = storage::strip_verbatim_prefix(new_game_dir);
                record.install_dir = clean_new_game_dir.to_string_lossy().to_string();

                let new_exe = new_game_dir.join(&record.exe_name);
                if new_exe.exists() {
                    let clean_new_exe = storage::strip_verbatim_prefix(&new_exe);
                    record.exe_path = clean_new_exe.to_string_lossy().to_string();
                }

                let new_cover_jpg = new_game_dir.join("cover.jpg");
                let new_cover_png = new_game_dir.join("cover.png");
                if new_cover_jpg.exists() {
                    record.capsule_image = Some(
                        storage::strip_verbatim_prefix(&new_cover_jpg)
                            .to_string_lossy()
                            .to_string(),
                    );
                } else if new_cover_png.exists() {
                    record.capsule_image = Some(
                        storage::strip_verbatim_prefix(&new_cover_png)
                            .to_string_lossy()
                            .to_string(),
                    );
                }

                storage::save_installed_record(record)?;
            }

            count += 1;
        }

        Ok(count)
    };

    match migration_exec() {
        Ok(migrated_count) => {
            // 所有目录迁移与 trainer.json 更新均成功！
            // 清理跨盘复制留在旧源目录中的文件夹
            for old_dir in copied_sources_to_clean {
                let _ = fs::remove_dir_all(&old_dir);
            }

            // 更新全局配置 custom_trainers_dir（若需要持久化）
            if persist_config {
                let clean_target = storage::strip_verbatim_prefix(&canon_target);
                let mut config = load_config();
                config.management.custom_trainers_dir =
                    Some(clean_target.to_string_lossy().to_string());
                save_config(&config)?;
            }

            Ok(migrated_count)
        }
        Err(err) => {
            // 发生错误，逆序执行回滚，保持源目录与配置 100% 完整原状
            for action in rollback_stack.into_iter().rev() {
                match action {
                    RollbackAction::RenameBack { from, to } => {
                        let _ = fs::rename(&from, &to);
                    }
                    RollbackAction::RemoveTargetDir(target) => {
                        let _ = fs::remove_dir_all(&target);
                    }
                }
            }
            // 严禁在此处更新 config.management.custom_trainers_dir！
            Err(format!("迁移失败，已安全回滚至初始状态: {}", err))
        }
    }
}

/// 一键无损迁移所有已安装修改器至新目录
pub fn migrate_trainers_dir(new_dir_str: &str) -> Result<u32, String> {
    let current_dir = storage::get_trainers_dir();
    migrate_trainers_dir_from_to(&current_dir, new_dir_str, true)
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

/// 配置 Windows 开机自启
pub fn set_launch_at_startup(enable: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::*;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu
            .create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run")
            .map_err(|e| format!("打开开机自启注册表项失败: {}", e))?;

        let app_name = "AdvancedFlingTrainerManager";
        if enable {
            let exe = std::env::current_exe()
                .map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;
            let val = format!("\"{}\"", exe.to_string_lossy());
            key.set_value(app_name, &val)
                .map_err(|e| format!("写入开机自启注册表失败: {}", e))?;
        } else {
            match key.delete_value(app_name) {
                Ok(_) => {}
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
                Err(e) => return Err(format!("删除开机自启注册表项失败: {}", e)),
            }
        }
    }

    let mut config = load_config();
    config.management.launch_at_startup = enable;
    save_config(&config)?;

    Ok(())
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

/// 根据全局网络配置构建统一 reqwest::Client
pub fn build_custom_http_client() -> Result<reqwest::Client, String> {
    let config = load_config();
    let net = &config.network;

    let timeout_val = if net.timeout_ms < 1000 {
        Duration::from_millis(8000)
    } else {
        Duration::from_millis(net.timeout_ms)
    };

    let mut builder = reqwest::Client::builder()
        .user_agent(crate::services::scraper::USER_AGENT)
        .timeout(timeout_val);

    match net.proxy_mode.as_str() {
        "direct" => {
            builder = builder.no_proxy();
        }
        "custom" => {
            let proxy_str = net.proxy_url.trim();
            if !proxy_str.is_empty() {
                let proxy = reqwest::Proxy::all(proxy_str)
                    .map_err(|e| format!("配置代理地址 '{}' 失败: {}", proxy_str, e))?;
                builder = builder.proxy(proxy);
            }
        }
        _ => {
            // "system" 模式，reqwest 默认根据系统网络环境处理
        }
    }

    builder
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))
}

/// 一键测试网络或自定义代理的连通性
pub async fn test_network_connectivity(
    custom_target: Option<String>,
) -> Result<NetworkTestResult, String> {
    let target = custom_target.unwrap_or_else(|| "https://flingtrainer.com".to_string());
    let client = build_custom_http_client()?;

    let start = std::time::Instant::now();
    match client.get(&target).send().await {
        Ok(resp) => {
            let latency_ms = start.elapsed().as_millis() as u64;
            let status = resp.status().as_u16();
            let success =
                resp.status().is_success() || status == 301 || status == 302 || status == 403;
            let message = if success {
                format!("连接测试通过 (HTTP {}, 延迟 {}ms)", status, latency_ms)
            } else {
                format!("服务器响应状态异常: HTTP {}", status)
            };
            Ok(NetworkTestResult {
                success,
                target_url: target,
                status_code: Some(status),
                latency_ms,
                message,
            })
        }
        Err(e) => {
            let latency_ms = start.elapsed().as_millis() as u64;
            Ok(NetworkTestResult {
                success: false,
                target_url: target,
                status_code: None,
                latency_ms,
                message: format!("连接测试失败: {}", e),
            })
        }
    }
}

/// 根据配置处理 Steam 封面图片加速链接
pub fn apply_steam_cdn_mirror(original_url: &str) -> String {
    let config = load_config();
    if !config.network.enable_steam_cdn {
        return original_url.to_string();
    }
    let host = if config.network.steam_cdn_host.is_empty() {
        "shared.cloudflare.steamstatic.com"
    } else {
        &config.network.steam_cdn_host
    };

    if original_url.contains("steamstatic.com")
        && let Ok(re) = regex::Regex::new(r"https?://[^/]+\.steamstatic\.com")
    {
        return re
            .replace(original_url, format!("https://{}", host))
            .to_string();
    }
    original_url.to_string()
}

/// 根据当前配置转换 GitHub 下载/API 镜像链接
pub fn apply_github_mirror(github_url: &str) -> String {
    let config = load_config();
    match config.network.update_source.as_str() {
        "ghproxy" => {
            format!("https://ghproxy.net/{}", github_url)
        }
        "mirror2" => {
            format!("https://mirror.ghproxy.com/{}", github_url)
        }
        _ => github_url.to_string(),
    }
}

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
