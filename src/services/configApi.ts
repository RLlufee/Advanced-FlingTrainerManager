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
  proxy_url: string;
  update_source: string;
  enable_steam_cdn: boolean;
  timeout_ms: number;
}

export interface AppConfig {
  hotkey: HotkeySettings;
  management: ManagementSettings;
  network: NetworkSettings;
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
};
