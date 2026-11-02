import { invoke } from "@tauri-apps/api/core";

export interface GpuInfo {
  name: string;
  driver_version: string;
}

export interface VolumeInfo {
  id: string;
  size_bytes: number;
  free_bytes: number;
}

export interface HardwareOverview {
  manufacturer: string;
  model: string;
  os: string;
  build: string;
  cpu: string;
  cores: number;
  threads: number;
  ram_total: number;
  ram_free: number;
  gpus: GpuInfo[];
  volumes: VolumeInfo[];
  mainboard: string;
  bios: string;
  boot_at: number | null;
}

export const hardwareApi = {
  /**
   * 采集系统硬件全景规格数据（只读无损）
   */
  getHardwareOverview: async (): Promise<HardwareOverview> => {
    return await invoke<HardwareOverview>("get_hardware_overview");
  },
};
