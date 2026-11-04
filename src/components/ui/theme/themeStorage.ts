import { ThemeSettings, WallpaperLayersConfig } from "../../../services/configApi";

export const DEFAULT_WALLPAPER_LAYERS: WallpaperLayersConfig = {
  sidebar: true,
  content: true,
  cards: false,
  titlebar: false,
  modals: false,
  card_opacity: 80,
  sidebar_opacity: 75,
  backdrop_blur: 12,
};

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const THEME_CACHE_KEY = "fling_theme_cache_v1";

export const getCachedThemeSnapshot = (): Partial<ThemeSettings> | null => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveCachedThemeSnapshot = (theme: Partial<ThemeSettings>): void => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const existing = getCachedThemeSnapshot() || {};
    const merged = { ...existing, ...theme };
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(merged));
  } catch {
    // 忽略本地存储写入异常
  }
};
