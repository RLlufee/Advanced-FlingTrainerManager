import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface TrainerOptionItem {
  title: string;
  note: string | null;
}

export interface Trainer {
  id: string;
  name: string;
  version: string;
  game_version: string;
  download_url: string;
  description: string;
  thumbnail: string;
  download_count: number;
  last_update: string;
  options: string[];
  option_items?: TrainerOptionItem[];
  installed_path?: string;
  is_installed: boolean;
  chinese_name?: string | null;
  steam_app_id?: number | null;
  hero_image?: string | null;
  capsule_image?: string | null;
}

export interface PaginatedTrainers {
  trainers: Trainer[];
  page: number;
  total_pages: number;
}

export interface DownloadProgressPayload {
  trainer_id: string;
  progress: number;
  downloaded_bytes: number;
  total_bytes: number | null;
  speed_bytes_per_sec: number;
  status: "downloading" | "extracting" | "completed" | "error";
  error: string | null;
}

export interface BatchEnrichResult {
  attempted: number;
  succeeded: number;
  failed: number;
}

export interface InstalledTrainerRecord {
  id: string;
  name: string;
  chinese_name?: string | null;
  version: string;
  game_version?: string;
  exe_path: string;
  exe_name?: string;
  install_dir: string;
  installed_at: string;
  last_launched_at: string | null;
  steam_app_id?: number | null;
  thumbnail?: string;
  hero_image?: string | null;
  capsule_image?: string | null;
  description?: string;
  options?: string[];
  option_items?: TrainerOptionItem[];
  saved_toggles?: Record<string, boolean>;
}

export const trainerApi = {
  fetchTrainers: async (page = 1, forceRefresh = false): Promise<PaginatedTrainers> => {
    return await invoke<PaginatedTrainers>("fetch_trainers", { page, forceRefresh });
  },

  searchTrainers: async (query: string, page = 1): Promise<PaginatedTrainers> => {
    return await invoke<PaginatedTrainers>("search_trainers", { query, page });
  },

  getTrainerDetail: async (id: string, forceRefresh: boolean = false): Promise<Trainer> => {
    return await invoke<Trainer>("get_trainer_detail", { id, forceRefresh });
  },

  downloadTrainer: async (trainer: Trainer): Promise<InstalledTrainerRecord> => {
    return await invoke<InstalledTrainerRecord>("download_trainer", { trainer });
  },

  getInstalledTrainers: async (): Promise<InstalledTrainerRecord[]> => {
    return await invoke<InstalledTrainerRecord[]>("get_installed_trainers");
  },

  launchTrainer: async (id: string): Promise<string> => {
    return await invoke<string>("launch_trainer", { id });
  },

  launchSteamGame: async (appId: number): Promise<void> => {
    return await invoke("launch_steam_game", { appId });
  },

  openSteamStore: async (appId: number): Promise<void> => {
    return await invoke("open_steam_store", { appId });
  },

  openInstallDir: async (dirPath: string): Promise<void> => {
    return await invoke("open_install_dir", { dirPath });
  },

  openTrainersRoot: async (): Promise<void> => {
    return await invoke("open_trainers_root");
  },

  deleteInstalledTrainer: async (id: string): Promise<void> => {
    return await invoke("delete_installed_trainer", { id });
  },

  launchGameAndTrainer: async (id: string, appId?: number | null): Promise<string> => {
    return await invoke<string>("launch_game_and_trainer", { id, appId: appId ?? null });
  },

  saveTrainerToggles: async (id: string, toggles: Record<string, boolean>): Promise<void> => {
    return await invoke("save_trainer_toggles", { id, toggles });
  },

  syncTrainerHotkeys: async (id: string, hotkeys: string[]): Promise<number> => {
    return await invoke<number>("sync_trainer_hotkeys", { id, hotkeys });
  },

  checkTrainersUpdate: async (): Promise<TrainerUpdateInfo[]> => {
    return await invoke<TrainerUpdateInfo[]>("check_trainers_update");
  },

  updateTrainerToLatest: async (id: string): Promise<InstalledTrainerRecord> => {
    return await invoke<InstalledTrainerRecord>("update_trainer_to_latest", { id });
  },

  pickExternalFolder: async (): Promise<string | null> => {
    return await invoke<string | null>("pick_external_folder");
  },

  scanAndImportTrainers: async (folderPath: string): Promise<ImportSummary> => {
    return await invoke<ImportSummary>("scan_and_import_trainers", { folderPath });
  },

  enrichInstalledTrainer: async (id: string): Promise<InstalledTrainerRecord> => {
    return await invoke<InstalledTrainerRecord>("enrich_installed_trainer", { id });
  },

  enrichAllInstalledTrainers: async (): Promise<BatchEnrichResult> => {
    return await invoke<BatchEnrichResult>("enrich_all_installed_trainers");
  },

  onDownloadProgress: async (
    callback: (payload: DownloadProgressPayload) => void
  ): Promise<UnlistenFn> => {
    return await listen<DownloadProgressPayload>("download-progress", (event) => {
      callback(event.payload);
    });
  },
};

export interface ImportSummary {
  total_scanned: number;
  imported_count: number;
  imported_names: string[];
  skipped_count: number;
}

export interface TrainerUpdateInfo {
  id: string;
  has_update: boolean;
  current_version: string;
  latest_version: string;
  current_game_version: string;
  latest_game_version: string;
  latest_trainer?: Trainer | null;
  check_status?: string | null;
  error_message?: string | null;
}
