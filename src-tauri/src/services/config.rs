use crate::services::storage::{self, get_app_data_dir, load_installed_records, save_installed_record};
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

/// 读取应用全局配置，若不存在则生成默认配置
pub fn load_config() -> AppConfig {
    let file = get_config_file_path();
    if file.exists() {
        if let Ok(content) = fs::read_to_string(&file) {
            if let Ok(config) = serde_json::from_str::<AppConfig>(&content) {
                return config;
            }
        }
    }
    let default_config = AppConfig::default();
    let _ = save_config(&default_config);
    default_config
}

/// 保存应用全局配置
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let file = get_config_file_path();
    if let Some(parent) = file.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    fs::write(&file, json).map_err(|e| format!("写入配置文件失败: {}", e))?;
    Ok(())
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

    serde_json::to_string_pretty(&items)
        .map_err(|e| format!("导出预设序列化失败: {}", e))
}

/// 从 JSON 恢复导入所有修改器的预设
pub fn import_all_presets(json_str: &str) -> Result<u32, String> {
    let items: Vec<TrainerPresetBackupItem> = serde_json::from_str(json_str)
        .map_err(|e| format!("导入预设解析失败，请确保格式正确: {}", e))?;

    let mut records = load_installed_records();
    let mut updated_count = 0u32;

    for item in items {
        if let Some(record) = records.iter_mut().find(|r| r.id == item.id || r.name == item.name) {
            record.saved_toggles = item.saved_toggles;
            let _ = save_installed_record(record.clone());
            updated_count += 1;
        }
    }

    Ok(updated_count)
}

/// 清空所有已安装修改器的开关预设
pub fn clear_all_presets() -> Result<u32, String> {
    let mut records = load_installed_records();
    let mut cleared_count = 0u32;

    for record in records.iter_mut() {
        if !record.saved_toggles.is_empty() {
            record.saved_toggles.clear();
            let _ = save_installed_record(record.clone());
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
    if trainers_dir.exists() {
        if let Ok(entries) = fs::read_dir(&trainers_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    if let Ok(sub_entries) = fs::read_dir(&p) {
                        for sub in sub_entries.flatten() {
                            let sp = sub.path();
                            if let Ok(meta) = sp.metadata() {
                                let len = meta.len();
                                total_size_bytes += len;

                                let file_name = sp.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                                if file_name == "cover.jpg" || file_name == "cover.png" {
                                    cover_cache_size_bytes += len;
                                    cover_cache_count += 1;
                                }
                            }
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

    // 1. 清理临时解压目录 fling_import_tmp
    let temp_import_dir = std::env::temp_dir().join("fling_import_tmp");
    if temp_import_dir.exists() {
        if let Ok(entries) = fs::read_dir(&temp_import_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if let Ok(meta) = p.metadata() {
                    freed_bytes += meta.len();
                    let _ = fs::remove_file(&p);
                    cleaned_files_count += 1;
                }
            }
        }
        let _ = fs::remove_dir(&temp_import_dir);
    }

    Ok(CleanSummary {
        cleaned_files_count,
        freed_bytes,
    })
}

/// 一键无损迁移所有已安装修改器至新目录
pub fn migrate_trainers_dir(new_dir_str: &str) -> Result<u32, String> {
    let target_dir = PathBuf::from(new_dir_str.trim());
    if target_dir.to_string_lossy().trim().is_empty() {
        return Err("目标目录路径不能为空".to_string());
    }

    let current_dir = storage::get_trainers_dir();
    if current_dir == target_dir {
        return Err("目标路径与当前路径相同，无需迁移".to_string());
    }

    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("创建目标目录失败: {}", e))?;

    let mut migrated_count = 0u32;

    if current_dir.exists() {
        if let Ok(entries) = fs::read_dir(&current_dir) {
            for entry in entries.flatten() {
                let old_game_dir = entry.path();
                if old_game_dir.is_dir() {
                    let folder_name = old_game_dir.file_name().unwrap_or_default();
                    let new_game_dir = target_dir.join(folder_name);

                    // 移动文件夹
                    let moved = if fs::rename(&old_game_dir, &new_game_dir).is_ok() {
                        true
                    } else {
                        // 跨驱动器 fallback：拷贝后删除
                        if copy_dir_all(&old_game_dir, &new_game_dir).is_ok() {
                            let _ = fs::remove_dir_all(&old_game_dir);
                            true
                        } else {
                            false
                        }
                    };

                    if moved {
                        // 修正该子目录内的 trainer.json
                        let info_file = new_game_dir.join("trainer.json");
                        if info_file.exists() {
                            if let Ok(content) = fs::read_to_string(&info_file) {
                                if let Ok(mut record) = serde_json::from_str::<crate::models::InstalledTrainerRecord>(&content) {
                                    record.install_dir = new_game_dir.to_string_lossy().to_string();
                                    let new_exe = new_game_dir.join(&record.exe_name);
                                    if new_exe.exists() {
                                        record.exe_path = new_exe.to_string_lossy().to_string();
                                    }
                                    let new_cover = new_game_dir.join("cover.jpg");
                                    if new_cover.exists() {
                                        record.capsule_image = Some(new_cover.to_string_lossy().to_string());
                                    }
                                    let _ = storage::save_installed_record(record);
                                }
                            }
                        }
                        migrated_count += 1;
                    }
                }
            }
        }
    }

    // 更新全局配置中的 custom_trainers_dir
    let mut config = load_config();
    config.management.custom_trainers_dir = Some(target_dir.to_string_lossy().to_string());
    save_config(&config)?;

    Ok(migrated_count)
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
        use std::process::Command;
        let exe = std::env::current_exe().map_err(|e| format!("获取当前可执行文件路径失败: {}", e))?;
        let exe_str = exe.to_string_lossy();

        if enable {
            let cmd = format!(
                r#"Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AdvancedFlingTrainerManager" -Value '"{}"' -Force"#,
                exe_str
            );
            let output = Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", &cmd])
                .output()
                .map_err(|e| format!("配置开机自启失败: {}", e))?;
            if !output.status.success() {
                return Err("设置开机自启注册表失败".to_string());
            }
        } else {
            let cmd = r#"Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AdvancedFlingTrainerManager" -ErrorAction SilentlyContinue"#;
            let _ = Command::new("powershell")
                .args(["-NoProfile", "-NonInteractive", "-Command", cmd])
                .output();
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

    builder.build().map_err(|e| format!("构建 HTTP 客户端失败: {}", e))
}

/// 一键测试网络或自定义代理的连通性
pub async fn test_network_connectivity(custom_target: Option<String>) -> Result<NetworkTestResult, String> {
    let target = custom_target.unwrap_or_else(|| "https://flingtrainer.com".to_string());
    let client = build_custom_http_client()?;

    let start = std::time::Instant::now();
    match client.get(&target).send().await {
        Ok(resp) => {
            let latency_ms = start.elapsed().as_millis() as u64;
            let status = resp.status().as_u16();
            let success = resp.status().is_success() || status == 301 || status == 302 || status == 403;
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

    if original_url.contains("steamstatic.com") {
        if let Ok(re) = regex::Regex::new(r"https?://[^/]+\.steamstatic\.com") {
            return re.replace(original_url, format!("https://{}", host)).to_string();
        }
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


