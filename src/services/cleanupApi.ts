import { invoke } from "@tauri-apps/api/core";

export interface CleanupCategorySummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  bytes: number;
  file_count: number;
}

export interface CleanupScanResult {
  total_bytes: number;
  total_files: number;
  categories: CleanupCategorySummary[];
  is_admin: boolean;
}

export interface CleanupRunResult {
  freed_bytes: number;
  cleaned_files: number;
  failed_count: number;
}

export const cleanupApi = {
  /**
   * 扫描系统与游戏着色器垃圾缓存（只读扫描，不修改任何文件）
   */
  scan: async (): Promise<CleanupScanResult> => {
    return await invoke<CleanupScanResult>("system_cleanup_scan");
  },

  /**
   * 执行指定分类的清理释放
   */
  run: async (categories: string[]): Promise<CleanupRunResult> => {
    return await invoke<CleanupRunResult>("system_cleanup_run", { categories });
  },
};
