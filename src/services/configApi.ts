import { invoke } from "@tauri-apps/api/core";

export interface HotkeySettings {
  run_as_admin: boolean;
  key_interval_ms: number;
  key_hold_ms: number;
  auto_sync_on_double_launch: boolean;
  double_launch_delay_sec: number;
  show_sync_toast: boolean;
}

export interface ManagementSettings {
  custom_trainers_dir: string | null;
  auto_extract_zip: boolean;
  scan_depth: number;
  close_to_tray: boolean;
  launch_at_startup: boolean;
}

export interface NetworkSettings {
  proxy_mode: "system" | "custom" | "direct";
  proxy_url: string;
  update_source: "official" | "ghproxy" | "mirror2";
  enable_steam_cdn: boolean;
  steam_cdn_host: string;
  timeout_ms: number;
  max_retry_count: number;
}

export interface NetworkTestResult {
  success: boolean;
  target_url: string;
  status_code?: number;
  latency_ms: number;
  message: string;
}

export type JellyIntensity = "off" | "gentle" | "medium" | "bouncy";

export interface AnimationSettings {
  enabled: boolean; // 动效总开关 (默认 true)
  speed_multiplier: number; // PCL-CE 同款速度倍率 (0.25x ~ 3.0x，默认 1.0；若设为 0 或 >= 30 视为瞬间完成)
  jelly_intensity: JellyIntensity; // 果冻弹性强度 (默认 "medium")
  paper_flutter: boolean; // 3D 纸片轻盈悬浮飘落入场动效 (默认 true)
  magnetic_tabs: boolean; // 磁吸跟手与流体滑动药丸 (默认 true)
  typewriter_speed: number; // 打字机提示打字间隔毫秒数 (0 = 瞬间完成，默认 18ms)
}

export type AccentColorKey =
  | "cyan"
  | "emerald"
  | "rose"
  | "violet"
  | "amber"
  | "gold"
  | "indigo"
  | "monochrome"
  | "custom"
  | "dynamic";

export type DynamicColorSource = "windows" | "image";

export interface MonetSavedImage {
  id: string;
  name: string;
  /** 持久化保存在 app_data/theme_wallpapers/ 下的缩略图绝对路径 */
  image_path: string;
  /** Google Monet 算法提取出的多枚候选色号 (Hex) */
  palette: string[];
  /** 用户在该图片下当前选定的色号 (Hex) */
  selected_hex: string;
  added_at: string;
}

export interface WallpaperSavedImage {
  id: string;
  name: string;
  image_path: string;
  added_at: string;
}

export type WallpaperFit = "cover" | "contain";

export type ColorMode = "system" | "light" | "dark";

export interface ThemeSettings {
  accent_color: AccentColorKey | string; // 预设标识 | "custom" | "dynamic"
  custom_accent_hex?: string | null; // 自定义十六进制颜色如 "#3b82f6"
  color_mode?: ColorMode; // 界面深浅色彩模式，默认 "system" (跟随系统)
  /** 根据当前强调色生成深浅自适应的主界面渐变背景 */
  gradient_background?: boolean;
  /** 动态取色激活源："windows" (系统强调色) | "image" (自定义图片莫奈色盘) */
  dynamic_source?: DynamicColorSource;
  /** 持久化保存的莫奈取色图片画廊列表 */
  monet_saved_images?: MonetSavedImage[];
  /** 当前激活的莫奈取色图片 ID */
  active_monet_image_id?: string | null;
  /** 动态取色最近一次生效的种子色号缓存 (冷启动 0ms 还原) */
  dynamic_seed_hex?: string | null;
  /** 高级选项：启动页选中修改器时跟随游戏封面动态变色 */
  game_adaptive_accent?: boolean;
  /** 管理器自定义壁纸图库 */
  wallpaper_images?: WallpaperSavedImage[];
  /** 当前应用的自定义壁纸 ID */
  active_wallpaper_id?: string | null;
  /** 壁纸显现度，0-100 */
  wallpaper_opacity?: number;
  /** 壁纸模糊半径，0-20px */
  wallpaper_blur?: number;
  /** 壁纸填充/适应方式 */
  wallpaper_fit?: WallpaperFit;
  /** 侧栏与页面底层透光度，0-50 */
  wallpaper_surface_transparency?: number;
}

export interface AppConfig {
  hotkey: HotkeySettings;
  management: ManagementSettings;
  network: NetworkSettings;
  animation?: AnimationSettings;
  theme?: ThemeSettings;
}

export interface StorageStats {
  trainers_dir: string;
  trainers_count: number;
  total_size_bytes: number;
  cover_cache_size_bytes: number;
  cover_cache_count: number;
  offline_dict_count: number;
}

export interface CleanSummary {
  cleaned_files_count: number;
  freed_bytes: number;
}

export const configApi = {
  // 获取全局配置
  async getConfig(): Promise<AppConfig> {
    return await invoke<AppConfig>("get_app_config");
  },

  // 保存全局配置
  async saveConfig(config: AppConfig): Promise<void> {
    return await invoke<void>("save_app_config", { config });
  },

  // 导出所有修改器开关预设 (JSON 文本)
  async exportAllPresets(): Promise<string> {
    return await invoke<string>("export_all_presets");
  },

  // 导入并恢复所有修改器开关预设
  async importAllPresets(jsonStr: string): Promise<number> {
    return await invoke<number>("import_all_presets", { jsonStr });
  },

  // 清空所有修改器开关预设
  async clearAllPresets(): Promise<number> {
    return await invoke<number>("clear_all_presets");
  },

  // 获取便携存储统计信息
  async getStorageStats(): Promise<StorageStats> {
    return await invoke<StorageStats>("get_storage_stats");
  },

  // 清理孤立缓存与临时文件
  async cleanOrphanCache(): Promise<CleanSummary> {
    return await invoke<CleanSummary>("clean_orphan_cache");
  },

  // 一键无损迁移现有全部修改器至新目录
  async migrateTrainersDir(newDir: string): Promise<number> {
    return await invoke<number>("migrate_trainers_dir", { newDir });
  },

  // 设置 Windows 开机自启
  async setLaunchAtStartup(enable: boolean): Promise<void> {
    return await invoke<void>("set_launch_at_startup", { enable });
  },

  // 调起文件夹选择器
  async pickDirectory(): Promise<string | null> {
    return await invoke<string | null>("pick_external_folder");
  },

  // 测试网络/代理连通性
  async testNetworkConnectivity(target?: string): Promise<NetworkTestResult> {
    return await invoke<NetworkTestResult>("test_network_connectivity", { target });
  },

  // 读取 Windows 系统当前主题强调色 (DWM AccentColor)
  async getWindowsAccentColor(): Promise<string> {
    return await invoke<string>("get_windows_accent_color");
  },

  // 将莫奈取色图片缩略图持久化落盘到 app_data/theme_wallpapers/
  async saveMonetWallpaperThumbnail(id: string, dataUrl: string): Promise<string> {
    return await invoke<string>("save_monet_wallpaper_thumbnail", { id, dataUrl });
  },

  // 删除本地持久化的莫奈取色缩略图文件
  async deleteMonetWallpaperFile(imagePath: string): Promise<void> {
    return await invoke<void>("delete_monet_wallpaper_file", { imagePath });
  },

  async saveWallpaperFromDataUrl(id: string, dataUrl: string): Promise<string> {
    return await invoke<string>("save_custom_wallpaper", { id, dataUrl });
  },

  async importWallpaperFromPath(id: string, sourcePath: string): Promise<string> {
    return await invoke<string>("import_custom_wallpaper", { id, sourcePath });
  },

  async deleteWallpaperFile(imagePath: string): Promise<void> {
    return await invoke<void>("delete_custom_wallpaper", { imagePath });
  },

  // 通过后端读取本地或远程图片为 Data URL（规避 Canvas 跨域污染并复用代理配置）
  async readImageAsDataUrl(source: string): Promise<string> {
    return await invoke<string>("read_image_as_data_url", { source });
  },
};
