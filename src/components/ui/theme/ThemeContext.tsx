/**
 * @file ThemeContext.tsx
 * @description 启动器主题色（Accent Color）、莫奈动态取色、深浅模式与自定义壁纸上下文中枢（模块化容器）
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  configApi,
  DynamicColorSource,
  MonetSavedImage,
  ColorMode,
  WallpaperSavedImage,
  WallpaperFit,
  WallpaperLayersConfig,
} from "../../../services/configApi";
import { ACCENT_PRESETS, AccentColorConfig, normalizeHex } from "./themePresets";
import {
  DEFAULT_WALLPAPER_LAYERS,
  THEME_CACHE_KEY,
  clampNumber,
  getCachedThemeSnapshot,
  saveCachedThemeSnapshot,
} from "./themeStorage";
import { useThemePersistence } from "./hooks/useThemePersistence";
import { useColorModeState } from "./hooks/useColorModeState";
import { useWallpaperState } from "./hooks/useWallpaperState";
import { useMonetState, EphemeralGameAccentInfo } from "./hooks/useMonetState";
import { useAccentState } from "./hooks/useAccentState";

export type { EphemeralGameAccentInfo };
export {
  DEFAULT_WALLPAPER_LAYERS,
  THEME_CACHE_KEY,
  getCachedThemeSnapshot,
  saveCachedThemeSnapshot,
};

export interface ThemeContextValue {
  accentColor: string;
  customHex: string;
  currentAccent: AccentColorConfig;
  presets: AccentColorConfig[];
  isCustom: boolean;
  isDynamic: boolean;

  // 界面深浅色彩模式
  colorMode: ColorMode;
  resolvedColorMode: "light" | "dark";
  isDark: boolean;
  gradientBackground: boolean;

  // 自定义壁纸
  wallpaperEnabled: boolean;
  wallpaperImages: WallpaperSavedImage[];
  activeWallpaper: WallpaperSavedImage | null;
  wallpaperOpacity: number;
  wallpaperBlur: number;
  wallpaperFit: WallpaperFit;
  wallpaperSurfaceTransparency: number;
  wallpaperLayers: WallpaperLayersConfig;
  isWallpaperLoadFailed: boolean;

  // 莫奈三级动态取色状态
  dynamicSource: DynamicColorSource;
  windowsAccentHex: string;
  monetSavedImages: MonetSavedImage[];
  activeMonetImageId: string | null;
  gameAdaptiveAccent: boolean;
  ephemeralGameAccent: EphemeralGameAccentInfo | null;
  isExtractingMonet: boolean;

  // 操作方法
  setColorMode: (mode: ColorMode) => Promise<void>;
  toggleColorMode: () => Promise<void>;
  setGradientBackground: (enabled: boolean) => Promise<void>;
  setWallpaperEnabled: (enabled: boolean) => Promise<void>;
  setWallpaperLayers: (patch: Partial<WallpaperLayersConfig>) => Promise<void>;
  resetWallpaperLayers: () => Promise<void>;
  addWallpaperFromFiles: (files: File[]) => Promise<number>;
  addWallpaperFromPaths: (paths: string[]) => Promise<number>;
  selectWallpaper: (id: string) => Promise<void>;
  removeWallpaper: (id: string) => Promise<void>;
  clearActiveWallpaper: () => Promise<void>;
  setWallpaperOpacity: (value: number) => Promise<void>;
  setWallpaperBlur: (value: number) => Promise<void>;
  setWallpaperFit: (value: WallpaperFit) => Promise<void>;
  setWallpaperSurfaceTransparency: (value: number) => Promise<void>;
  markWallpaperLoadFailed: () => void;
  setAccentColor: (colorId: string) => Promise<void>;
  setCustomHex: (hex: string) => Promise<void>;
  enableDynamicColor: () => Promise<void>;
  refreshWindowsAccent: () => Promise<string>;
  setDynamicSource: (source: DynamicColorSource) => Promise<void>;
  addMonetImagesFromFiles: (files: File[]) => Promise<number>;
  addMonetImagesFromPaths: (paths: string[]) => Promise<number>;
  selectMonetImageSwatch: (imageId: string, hex: string) => Promise<void>;
  removeMonetImage: (imageId: string) => Promise<void>;
  setGameAdaptiveAccent: (enabled: boolean) => Promise<void>;
  applyEphemeralGameAccent: (info: EphemeralGameAccentInfo | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialCache = useMemo(() => getCachedThemeSnapshot(), []);
  const { configRef, persistTheme } = useThemePersistence();

  // 1. 色彩深浅外观模式子状态机
  const colorModeState = useColorModeState({
    initialColorMode: (initialCache?.color_mode as ColorMode) || "system",
    initialGradientBackground: initialCache?.gradient_background ?? true,
    persistTheme,
  });

  // 2. 自定义壁纸子状态机
  const wallpaperState = useWallpaperState({
    initialWallpaperEnabled: initialCache?.wallpaper_enabled ?? true,
    initialWallpaperImages: initialCache?.wallpaper_images || [],
    initialWallpaperLayers: {
      ...DEFAULT_WALLPAPER_LAYERS,
      ...(initialCache?.wallpaper_layers || {}),
    },
    initialActiveWallpaperId: initialCache?.active_wallpaper_id ?? null,
    initialWallpaperOpacity: initialCache?.wallpaper_opacity ?? 65,
    initialWallpaperBlur: initialCache?.wallpaper_blur ?? 0,
    initialWallpaperFit: (initialCache?.wallpaper_fit as WallpaperFit) || "cover",
    initialWallpaperSurfaceTransparency: initialCache?.wallpaper_surface_transparency ?? 20,
    persistTheme,
  });

  // 3. 莫奈动态三级取色子状态机
  const monetState = useMonetState({
    initialDynamicSource: (initialCache?.dynamic_source as DynamicColorSource) || "windows",
    initialDynamicSeedHex: initialCache?.dynamic_seed_hex || null,
    initialMonetSavedImages: initialCache?.monet_saved_images || [],
    initialActiveMonetImageId: initialCache?.active_monet_image_id || null,
    initialGameAdaptiveAccent: initialCache?.game_adaptive_accent ?? false,
    accentColor: initialCache?.accent_color || "cyan",
    onSetAccentColorToDynamic: () => accentState.setAccentColorState("dynamic"),
    persistTheme,
  });

  // 4. 主题色与强调色子状态机
  const accentState = useAccentState({
    initialAccentColor: initialCache?.accent_color || "cyan",
    initialCustomHex: initialCache?.custom_accent_hex || "#06b6d4",
    dynamicSource: monetState.dynamicSource,
    windowsAccentHex: monetState.windowsAccentHex,
    dynamicSeedHex: monetState.dynamicSeedHex,
    monetSavedImages: monetState.monetSavedImages,
    activeMonetImageId: monetState.activeMonetImageId,
    gameAdaptiveAccent: monetState.gameAdaptiveAccent,
    ephemeralGameAccent: monetState.ephemeralGameAccent,
    isDark: colorModeState.isDark,
    gradientBackground: colorModeState.gradientBackground,
    onClearEphemeralGameAccent: () => monetState.setEphemeralGameAccent(null),
    persistTheme,
  });

  // 5. 初始化加载全局持久配置 + Windows 系统强调色
  useEffect(() => {
    let mounted = true;
    const initTheme = async () => {
      const [cfgRes, winRes] = await Promise.allSettled([
        configApi.getConfig(),
        configApi.getWindowsAccentColor(),
      ]);

      if (!mounted) return;

      if (winRes.status === "fulfilled" && winRes.value) {
        const detectedWinHex = normalizeHex(winRes.value) || "#0078d4";
        monetState.setWindowsAccentHex(detectedWinHex);
      }

      if (cfgRes.status === "fulfilled") {
        const cfg = cfgRes.value;
        configRef.current = cfg;
        const t = cfg.theme;
        if (t) {
          saveCachedThemeSnapshot(t);
          if (t.color_mode === "light" || t.color_mode === "dark" || t.color_mode === "system") {
            colorModeState.setColorModeState(t.color_mode);
          }
          if (typeof t.gradient_background === "boolean") {
            colorModeState.setGradientBackgroundState(t.gradient_background);
          }
          if (typeof t.wallpaper_enabled === "boolean") {
            wallpaperState.setWallpaperEnabledState(t.wallpaper_enabled);
          }
          if (t.wallpaper_layers) {
            wallpaperState.setWallpaperLayersState({
              ...DEFAULT_WALLPAPER_LAYERS,
              ...t.wallpaper_layers,
            });
          }
          if (Array.isArray(t.wallpaper_images)) {
            wallpaperState.wallpaperImagesRef.current = t.wallpaper_images;
            wallpaperState.setWallpaperImages(t.wallpaper_images);
          }
          if (t.active_wallpaper_id !== undefined) {
            wallpaperState.setActiveWallpaperId(t.active_wallpaper_id ?? null);
          }
          if (typeof t.wallpaper_opacity === "number") {
            wallpaperState.setWallpaperOpacityState(clampNumber(t.wallpaper_opacity, 0, 100));
          }
          if (typeof t.wallpaper_blur === "number") {
            wallpaperState.setWallpaperBlurState(clampNumber(t.wallpaper_blur, 0, 20));
          }
          if (t.wallpaper_fit === "cover" || t.wallpaper_fit === "contain") {
            wallpaperState.setWallpaperFitState(t.wallpaper_fit);
          }
          if (typeof t.wallpaper_surface_transparency === "number") {
            wallpaperState.setWallpaperSurfaceTransparencyState(
              clampNumber(t.wallpaper_surface_transparency, 0, 50)
            );
          }
          if (t.accent_color) accentState.setAccentColorState(t.accent_color);
          if (t.custom_accent_hex) accentState.setCustomHexState(t.custom_accent_hex);
          if (t.dynamic_source === "windows" || t.dynamic_source === "image") {
            monetState.setDynamicSourceState(t.dynamic_source);
          }
          if (Array.isArray(t.monet_saved_images)) {
            monetState.setMonetSavedImages(t.monet_saved_images);
          }
          if (t.active_monet_image_id !== undefined) {
            monetState.setActiveMonetImageId(t.active_monet_image_id ?? null);
          }
          if (t.dynamic_seed_hex) {
            monetState.setDynamicSeedHex(t.dynamic_seed_hex);
          }
          if (typeof t.game_adaptive_accent === "boolean") {
            monetState.setGameAdaptiveAccentState(t.game_adaptive_accent);
          }
        }
      } else {
        console.warn("读取主题配置失败，使用默认青空主题", cfgRes.reason);
      }
    };

    initTheme();
    return () => {
      mounted = false;
    };
  }, []);

  const presets = useMemo(() => Object.values(ACCENT_PRESETS), []);

  const value: ThemeContextValue = {
    accentColor: accentState.accentColor,
    customHex: accentState.customHex,
    currentAccent: accentState.currentAccent,
    presets,
    isCustom: accentState.accentColor === "custom",
    isDynamic: accentState.accentColor === "dynamic",

    colorMode: colorModeState.colorMode,
    resolvedColorMode: colorModeState.resolvedColorMode,
    isDark: colorModeState.isDark,
    gradientBackground: colorModeState.gradientBackground,
    setColorMode: colorModeState.setColorMode,
    toggleColorMode: colorModeState.toggleColorMode,
    setGradientBackground: colorModeState.setGradientBackground,

    wallpaperEnabled: wallpaperState.wallpaperEnabled,
    wallpaperLayers: wallpaperState.wallpaperLayers,
    setWallpaperEnabled: wallpaperState.setWallpaperEnabled,
    setWallpaperLayers: wallpaperState.setWallpaperLayers,
    resetWallpaperLayers: wallpaperState.resetWallpaperLayers,
    wallpaperImages: wallpaperState.wallpaperImages,
    activeWallpaper: wallpaperState.activeWallpaper,
    wallpaperOpacity: wallpaperState.wallpaperOpacity,
    wallpaperBlur: wallpaperState.wallpaperBlur,
    wallpaperFit: wallpaperState.wallpaperFit,
    wallpaperSurfaceTransparency: wallpaperState.wallpaperSurfaceTransparency,
    isWallpaperLoadFailed: wallpaperState.isWallpaperLoadFailed,
    addWallpaperFromFiles: wallpaperState.addWallpaperFromFiles,
    addWallpaperFromPaths: wallpaperState.addWallpaperFromPaths,
    selectWallpaper: wallpaperState.selectWallpaper,
    removeWallpaper: wallpaperState.removeWallpaper,
    clearActiveWallpaper: wallpaperState.clearActiveWallpaper,
    setWallpaperOpacity: wallpaperState.setWallpaperOpacity,
    setWallpaperBlur: wallpaperState.setWallpaperBlur,
    setWallpaperFit: wallpaperState.setWallpaperFit,
    setWallpaperSurfaceTransparency: wallpaperState.setWallpaperSurfaceTransparency,
    markWallpaperLoadFailed: wallpaperState.markWallpaperLoadFailed,

    dynamicSource: monetState.dynamicSource,
    windowsAccentHex: monetState.windowsAccentHex,
    monetSavedImages: monetState.monetSavedImages,
    activeMonetImageId: monetState.activeMonetImageId,
    gameAdaptiveAccent: monetState.gameAdaptiveAccent,
    ephemeralGameAccent: monetState.ephemeralGameAccent,
    isExtractingMonet: monetState.isExtractingMonet,
    setAccentColor: accentState.setAccentColor,
    setCustomHex: accentState.setCustomHex,
    enableDynamicColor: monetState.enableDynamicColor,
    refreshWindowsAccent: monetState.refreshWindowsAccent,
    setDynamicSource: monetState.setDynamicSource,
    addMonetImagesFromFiles: monetState.addMonetImagesFromFiles,
    addMonetImagesFromPaths: monetState.addMonetImagesFromPaths,
    selectMonetImageSwatch: monetState.selectMonetImageSwatch,
    removeMonetImage: monetState.removeMonetImage,
    setGameAdaptiveAccent: monetState.setGameAdaptiveAccent,
    applyEphemeralGameAccent: monetState.applyEphemeralGameAccent,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme 必须在 ThemeProvider 内部使用喵！");
  }
  return ctx;
};
