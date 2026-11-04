import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  ThemeSettings,
  WallpaperSavedImage,
  WallpaperLayersConfig,
  WallpaperFit,
  configApi,
} from "../../../../services/configApi";
import { DEFAULT_WALLPAPER_LAYERS, clampNumber } from "../themeStorage";
import { applyWallpaperToDom } from "../themeDomApplier";
import { readFileToDataUrl } from "../monetEngine";

const SUPPORTED_IMAGE_EXT = /\.(png|jpe?g|webp|bmp)$/i;
const MAX_WALLPAPER_BYTES = 20 * 1024 * 1024;

interface UseWallpaperStateProps {
  initialWallpaperEnabled?: boolean;
  initialWallpaperImages?: WallpaperSavedImage[];
  initialWallpaperLayers?: WallpaperLayersConfig;
  initialActiveWallpaperId?: string | null;
  initialWallpaperOpacity?: number;
  initialWallpaperBlur?: number;
  initialWallpaperFit?: WallpaperFit;
  initialWallpaperSurfaceTransparency?: number;
  persistTheme: (patch: Partial<ThemeSettings>) => void;
}

export function useWallpaperState({
  initialWallpaperEnabled = true,
  initialWallpaperImages = [],
  initialWallpaperLayers = DEFAULT_WALLPAPER_LAYERS,
  initialActiveWallpaperId = null,
  initialWallpaperOpacity = 65,
  initialWallpaperBlur = 0,
  initialWallpaperFit = "cover",
  initialWallpaperSurfaceTransparency = 20,
  persistTheme,
}: UseWallpaperStateProps) {
  const [wallpaperEnabled, setWallpaperEnabledState] = useState<boolean>(initialWallpaperEnabled);
  const [wallpaperImages, setWallpaperImages] = useState<WallpaperSavedImage[]>(initialWallpaperImages);
  const wallpaperImagesRef = useRef<WallpaperSavedImage[]>(initialWallpaperImages);
  const [wallpaperLayers, setWallpaperLayersState] = useState<WallpaperLayersConfig>(initialWallpaperLayers);
  const [activeWallpaperId, setActiveWallpaperId] = useState<string | null>(initialActiveWallpaperId);
  const [wallpaperOpacity, setWallpaperOpacityState] = useState<number>(initialWallpaperOpacity);
  const [wallpaperBlur, setWallpaperBlurState] = useState<number>(initialWallpaperBlur);
  const [wallpaperFit, setWallpaperFitState] = useState<WallpaperFit>(initialWallpaperFit);
  const [wallpaperSurfaceTransparency, setWallpaperSurfaceTransparencyState] =
    useState<number>(initialWallpaperSurfaceTransparency);
  const [isWallpaperLoadFailed, setIsWallpaperLoadFailed] = useState<boolean>(false);

  const activeWallpaper = useMemo(
    () => wallpaperImages.find((image) => image.id === activeWallpaperId) || null,
    [activeWallpaperId, wallpaperImages]
  );

  // 同步壁纸 DOM dataset 与 CSS 变量
  useEffect(() => {
    const wallpaperIsActive = Boolean(
      wallpaperEnabled && activeWallpaper && !isWallpaperLoadFailed
    );
    applyWallpaperToDom(
      wallpaperIsActive,
      wallpaperLayers,
      wallpaperSurfaceTransparency
    );
  }, [
    wallpaperEnabled,
    activeWallpaper,
    isWallpaperLoadFailed,
    wallpaperSurfaceTransparency,
    wallpaperLayers,
  ]);

  const setWallpaperEnabled = useCallback(
    async (enabled: boolean) => {
      setWallpaperEnabledState(enabled);
      if (enabled && !activeWallpaperId && wallpaperImagesRef.current.length > 0) {
        const firstId = wallpaperImagesRef.current[0].id;
        setActiveWallpaperId(firstId);
        setIsWallpaperLoadFailed(false);
        persistTheme({ wallpaper_enabled: true, active_wallpaper_id: firstId });
        return;
      }
      persistTheme({ wallpaper_enabled: enabled });
    },
    [activeWallpaperId, persistTheme]
  );

  const setWallpaperLayers = useCallback(
    async (patch: Partial<WallpaperLayersConfig>) => {
      setWallpaperLayersState((prev) => {
        const next = { ...prev, ...patch };
        persistTheme({ wallpaper_layers: next });
        return next;
      });
    },
    [persistTheme]
  );

  const resetWallpaperLayers = useCallback(async () => {
    setWallpaperLayersState(DEFAULT_WALLPAPER_LAYERS);
    persistTheme({ wallpaper_layers: DEFAULT_WALLPAPER_LAYERS });
  }, [persistTheme]);

  const setWallpaperOpacity = useCallback(
    async (value: number) => {
      const next = Math.round(clampNumber(value, 0, 100));
      setWallpaperOpacityState(next);
      persistTheme({ wallpaper_opacity: next });
    },
    [persistTheme]
  );

  const setWallpaperBlur = useCallback(
    async (value: number) => {
      const next = Math.round(clampNumber(value, 0, 20));
      setWallpaperBlurState(next);
      persistTheme({ wallpaper_blur: next });
    },
    [persistTheme]
  );

  const setWallpaperFit = useCallback(
    async (value: WallpaperFit) => {
      setWallpaperFitState(value);
      persistTheme({ wallpaper_fit: value });
    },
    [persistTheme]
  );

  const setWallpaperSurfaceTransparency = useCallback(
    async (value: number) => {
      const next = Math.round(clampNumber(value, 0, 50));
      setWallpaperSurfaceTransparencyState(next);
      persistTheme({ wallpaper_surface_transparency: next });
    },
    [persistTheme]
  );

  const saveNewWallpapers = useCallback(
    (newImages: WallpaperSavedImage[]) => {
      if (newImages.length === 0) return;
      const combined = [...newImages, ...wallpaperImagesRef.current];
      wallpaperImagesRef.current = combined;
      setWallpaperImages(combined);
      setActiveWallpaperId(newImages[0].id);
      setIsWallpaperLoadFailed(false);
      persistTheme({ wallpaper_images: combined, active_wallpaper_id: newImages[0].id });
    },
    [persistTheme]
  );

  const addWallpaperFromFiles = useCallback(
    async (files: File[]): Promise<number> => {
      const candidates = files.filter(
        (file) => file.size <= MAX_WALLPAPER_BYTES && SUPPORTED_IMAGE_EXT.test(file.name)
      );
      const saved: WallpaperSavedImage[] = [];

      for (const file of candidates) {
        try {
          const id = `wallpaper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const dataUrl = await readFileToDataUrl(file);
          const imagePath = await configApi.saveWallpaperFromDataUrl(id, dataUrl);
          saved.push({
            id,
            name: file.name.replace(/\.[^.]+$/, "") || "自定义壁纸",
            image_path: imagePath,
            added_at: new Date().toLocaleDateString("zh-CN"),
          });
        } catch (err) {
          console.warn(`导入壁纸 ${file.name} 失败:`, err);
        }
      }

      saveNewWallpapers(saved);
      return saved.length;
    },
    [saveNewWallpapers]
  );

  const addWallpaperFromPaths = useCallback(
    async (paths: string[]): Promise<number> => {
      const candidates = paths.filter((path) => SUPPORTED_IMAGE_EXT.test(path));
      const saved: WallpaperSavedImage[] = [];

      for (const sourcePath of candidates) {
        try {
          const id = `wallpaper_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const imagePath = await configApi.importWallpaperFromPath(id, sourcePath);
          const name =
            sourcePath
              .split(/[\\/]/)
              .pop()
              ?.replace(/\.[^.]+$/, "") || "自定义壁纸";
          saved.push({
            id,
            name,
            image_path: imagePath,
            added_at: new Date().toLocaleDateString("zh-CN"),
          });
        } catch (err) {
          console.warn(`导入壁纸路径 ${sourcePath} 失败:`, err);
        }
      }

      saveNewWallpapers(saved);
      return saved.length;
    },
    [saveNewWallpapers]
  );

  const selectWallpaper = useCallback(
    async (id: string) => {
      if (!wallpaperImagesRef.current.some((image) => image.id === id)) return;
      setActiveWallpaperId(id);
      setIsWallpaperLoadFailed(false);
      persistTheme({ active_wallpaper_id: id });
    },
    [persistTheme]
  );

  const clearActiveWallpaper = useCallback(async () => {
    setActiveWallpaperId(null);
    setIsWallpaperLoadFailed(false);
    persistTheme({ active_wallpaper_id: null });
  }, [persistTheme]);

  const removeWallpaper = useCallback(
    async (id: string) => {
      const image = wallpaperImagesRef.current.find((candidate) => candidate.id === id);
      if (!image) return;
      await configApi.deleteWallpaperFile(image.image_path);
      const remaining = wallpaperImagesRef.current.filter((candidate) => candidate.id !== id);
      wallpaperImagesRef.current = remaining;
      const nextActiveId = activeWallpaperId === id ? null : activeWallpaperId;
      setWallpaperImages(remaining);
      setActiveWallpaperId(nextActiveId);
      setIsWallpaperLoadFailed(false);
      persistTheme({ wallpaper_images: remaining, active_wallpaper_id: nextActiveId });
    },
    [activeWallpaperId, persistTheme]
  );

  const markWallpaperLoadFailed = useCallback(() => {
    setIsWallpaperLoadFailed(true);
  }, []);

  return {
    wallpaperEnabled,
    wallpaperImages,
    wallpaperImagesRef,
    wallpaperLayers,
    activeWallpaperId,
    activeWallpaper,
    wallpaperOpacity,
    wallpaperBlur,
    wallpaperFit,
    wallpaperSurfaceTransparency,
    isWallpaperLoadFailed,
    setWallpaperEnabledState,
    setWallpaperImages,
    setWallpaperLayersState,
    setActiveWallpaperId,
    setWallpaperOpacityState,
    setWallpaperBlurState,
    setWallpaperFitState,
    setWallpaperSurfaceTransparencyState,
    setWallpaperEnabled,
    setWallpaperLayers,
    resetWallpaperLayers,
    setWallpaperOpacity,
    setWallpaperBlur,
    setWallpaperFit,
    setWallpaperSurfaceTransparency,
    addWallpaperFromFiles,
    addWallpaperFromPaths,
    selectWallpaper,
    clearActiveWallpaper,
    removeWallpaper,
    markWallpaperLoadFailed,
  };
}
