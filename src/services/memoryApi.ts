import { invoke } from "@tauri-apps/api/core";

export interface SystemMemoryInfo {
  total_phys_bytes: number;
  avail_phys_bytes: number;
  used_phys_bytes: number;
  used_percent: number;
  total_pagefile_bytes: number;
  avail_pagefile_bytes: number;
  is_admin: boolean;
}

export interface MemoryOptimizeOptions {
  empty_working_sets: boolean;
  flush_file_cache: boolean;
  flush_modified_list: boolean;
  purge_standby_list: boolean;
  purge_low_priority_standby: boolean;
  combine_physical_memory: boolean;
  registry_reconciliation: boolean;
}

export interface MemoryOptimizeResult {
  success: boolean;
  freed_bytes: number;
  before: SystemMemoryInfo;
  after: SystemMemoryInfo;
  logs: string[];
  is_admin: boolean;
}

export const getSystemMemoryInfo = async (): Promise<SystemMemoryInfo> => {
  return await invoke<SystemMemoryInfo>("get_system_memory_info");
};

export const optimizeMemory = async (
  options?: Partial<MemoryOptimizeOptions>
): Promise<MemoryOptimizeResult> => {
  return await invoke<MemoryOptimizeResult>("optimize_memory", { options });
};

export const restartAppAsAdmin = async (): Promise<void> => {
  return await invoke<void>("restart_app_as_admin");
};

export const openSystemTool = async (tool: "dxdiag" | "joy.cpl" | "taskmgr" | "sysdm.cpl" | "temp"): Promise<void> => {
  return await invoke<void>("open_system_tool", { tool });
};
