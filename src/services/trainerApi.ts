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

export interface InstalledTrainerRecord {
  id: string;
  name: string;
  version: string;
  exe_path: string;
  install_dir: string;
  installed_at: string;
  last_launched_at: string | null;
}

export const trainerApi = {
  fetchTrainers: async (page = 1): Promise<PaginatedTrainers> => {
    return await invoke<PaginatedTrainers>("fetch_trainers", { page });
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

  onDownloadProgress: async (
    callback: (payload: DownloadProgressPayload) => void
  ): Promise<UnlistenFn> => {
    return await listen<DownloadProgressPayload>("download-progress", (event) => {
      callback(event.payload);
    });
  },
};
