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

export interface AppConfig {
  hotkey: HotkeySettings;
  management: ManagementSettings;
  network: NetworkSettings;
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
};
