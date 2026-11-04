import { useState, useCallback } from "react";
import {
  DynamicColorSource,
  MonetSavedImage,
  ThemeSettings,
  configApi,
} from "../../../../services/configApi";
import { normalizeHex } from "../themePresets";
import { extractMonetFromDataUrl, readFileToDataUrl } from "../monetEngine";

export interface EphemeralGameAccentInfo {
  trainerId: string;
  trainerName: string;
  hex: string;
}

const SUPPORTED_IMAGE_EXT = /\.(png|jpe?g|webp|bmp)$/i;

interface UseMonetStateProps {
  initialDynamicSource?: DynamicColorSource;
  initialDynamicSeedHex?: string | null;
  initialMonetSavedImages?: MonetSavedImage[];
  initialActiveMonetImageId?: string | null;
  initialGameAdaptiveAccent?: boolean;
  accentColor: string;
  onSetAccentColorToDynamic: () => void;
  persistTheme: (patch: Partial<ThemeSettings>) => void;
}

export function useMonetState({
  initialDynamicSource = "windows",
  initialDynamicSeedHex = null,
  initialMonetSavedImages = [],
  initialActiveMonetImageId = null,
  initialGameAdaptiveAccent = false,
  accentColor,
  onSetAccentColorToDynamic,
  persistTheme,
}: UseMonetStateProps) {
  const [dynamicSource, setDynamicSourceState] = useState<DynamicColorSource>(initialDynamicSource);
  const [windowsAccentHex, setWindowsAccentHex] = useState<string>("#0078d4");
  const [dynamicSeedHex, setDynamicSeedHex] = useState<string | null>(initialDynamicSeedHex);
  const [monetSavedImages, setMonetSavedImages] = useState<MonetSavedImage[]>(initialMonetSavedImages);
  const [activeMonetImageId, setActiveMonetImageId] = useState<string | null>(initialActiveMonetImageId);
  const [gameAdaptiveAccent, setGameAdaptiveAccentState] = useState<boolean>(initialGameAdaptiveAccent);
  const [ephemeralGameAccent, setEphemeralGameAccent] = useState<EphemeralGameAccentInfo | null>(null);
  const [isExtractingMonet, setIsExtractingMonet] = useState<boolean>(false);

  // 刷新读取最新的 Windows 系统主题强调色
  const refreshWindowsAccent = useCallback(async (): Promise<string> => {
    try {
      const raw = await configApi.getWindowsAccentColor();
      const valid = normalizeHex(raw) || "#0078d4";
      setWindowsAccentHex(valid);
      if (accentColor === "dynamic" && dynamicSource === "windows") {
        setDynamicSeedHex(valid);
        persistTheme({ dynamic_seed_hex: valid });
      }
      return valid;
    } catch {
      return windowsAccentHex;
    }
  }, [accentColor, dynamicSource, persistTheme, windowsAccentHex]);

  // 一键开启莫奈动态取色模式
  const enableDynamicColor = useCallback(async () => {
    onSetAccentColorToDynamic();
    setEphemeralGameAccent(null);
    const latestWinHex = await refreshWindowsAccent();

    let seed = latestWinHex;
    if (dynamicSource === "image" && monetSavedImages.length > 0) {
      const activeImg =
        monetSavedImages.find((img) => img.id === activeMonetImageId) ||
        monetSavedImages[0];
      if (activeImg) {
        seed = activeImg.selected_hex;
      }
    }
    setDynamicSeedHex(seed);
    persistTheme({
      accent_color: "dynamic",
      dynamic_seed_hex: seed,
    });
  }, [
    activeMonetImageId,
    dynamicSource,
    monetSavedImages,
    onSetAccentColorToDynamic,
    persistTheme,
    refreshWindowsAccent,
  ]);

  // 切换动态取色基础源 ("windows" | "image")
  const setDynamicSource = useCallback(
    async (source: DynamicColorSource) => {
      onSetAccentColorToDynamic();
      setDynamicSourceState(source);
      setEphemeralGameAccent(null);

      let seed = windowsAccentHex;
      if (source === "windows") {
        seed = await refreshWindowsAccent();
      } else if (monetSavedImages.length > 0) {
        const activeImg =
          monetSavedImages.find((img) => img.id === activeMonetImageId) ||
          monetSavedImages[0];
        if (activeImg) {
          seed = activeImg.selected_hex;
          if (!activeMonetImageId) {
            setActiveMonetImageId(activeImg.id);
          }
        }
      }

      setDynamicSeedHex(seed);
      persistTheme({
        accent_color: "dynamic",
        dynamic_source: source,
        dynamic_seed_hex: seed,
      });
    },
    [
      activeMonetImageId,
      monetSavedImages,
      onSetAccentColorToDynamic,
      persistTheme,
      refreshWindowsAccent,
      windowsAccentHex,
    ]
  );

  // 内部公共流程：处理一组 DataURL 图片进行莫奈取色并持久化落盘
  const ingestMonetItems = useCallback(
    async (rawItems: Array<{ name: string; dataUrl: string }>): Promise<number> => {
      if (rawItems.length === 0) return 0;
      setIsExtractingMonet(true);
      try {
        const newlyCreated: MonetSavedImage[] = [];
        for (const item of rawItems) {
          try {
            const { palette, thumbnailDataUrl } = await extractMonetFromDataUrl(
              item.dataUrl,
              6
            );
            if (palette.length === 0) continue;

            const id = `monet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const savedPath = await configApi.saveMonetWallpaperThumbnail(
              id,
              thumbnailDataUrl || item.dataUrl
            );

            newlyCreated.push({
              id,
              name: item.name,
              image_path: savedPath,
              palette,
              selected_hex: palette[0],
              added_at: new Date().toLocaleDateString("zh-CN"),
            });
          } catch (err) {
            console.warn(`提取图片 ${item.name} 莫奈配色失败:`, err);
          }
        }

        if (newlyCreated.length === 0) return 0;

        const firstNew = newlyCreated[0];
        setMonetSavedImages((prev) => {
          const combined = [...newlyCreated, ...prev];
          const overflow = combined.slice(16);
          overflow.forEach((old) => {
            configApi.deleteMonetWallpaperFile(old.image_path).catch(() => {});
          });
          const trimmed = combined.slice(0, 16);

          persistTheme({
            accent_color: "dynamic",
            dynamic_source: "image",
            monet_saved_images: trimmed,
            active_monet_image_id: firstNew.id,
            dynamic_seed_hex: firstNew.selected_hex,
          });
          return trimmed;
        });

        onSetAccentColorToDynamic();
        setDynamicSourceState("image");
        setActiveMonetImageId(firstNew.id);
        setDynamicSeedHex(firstNew.selected_hex);
        setEphemeralGameAccent(null);

        return newlyCreated.length;
      } finally {
        setIsExtractingMonet(false);
      }
    },
    [onSetAccentColorToDynamic, persistTheme]
  );

  const addMonetImagesFromFiles = useCallback(
    async (files: File[]): Promise<number> => {
      const imageFiles = files.filter(
        (f) => f.type.startsWith("image/") || SUPPORTED_IMAGE_EXT.test(f.name)
      );
      if (imageFiles.length === 0) return 0;

      const loaded: Array<{ name: string; dataUrl: string }> = [];
      for (const file of imageFiles) {
        try {
          const dataUrl = await readFileToDataUrl(file);
          const cleanName = file.name.replace(/\.[^.]+$/, "") || "自定义壁纸";
          loaded.push({ name: cleanName, dataUrl });
        } catch {
          // 跳过损坏文件
        }
      }
      return await ingestMonetItems(loaded);
    },
    [ingestMonetItems]
  );

  const addMonetImagesFromPaths = useCallback(
    async (paths: string[]): Promise<number> => {
      const imagePaths = paths.filter((p) => SUPPORTED_IMAGE_EXT.test(p));
      if (imagePaths.length === 0) return 0;

      const loaded: Array<{ name: string; dataUrl: string }> = [];
      for (const p of imagePaths) {
        try {
          const dataUrl = await configApi.readImageAsDataUrl(p);
          const baseName =
            p
              .split(/[\\/]/)
              .pop()
              ?.replace(/\.[^.]+$/, "") || "自定义壁纸";
          loaded.push({ name: baseName, dataUrl });
        } catch {
          // 跳过不可读路径
        }
      }
      return await ingestMonetItems(loaded);
    },
    [ingestMonetItems]
  );

  const selectMonetImageSwatch = useCallback(
    async (imageId: string, hex: string) => {
      const validHex = normalizeHex(hex) || hex;
      onSetAccentColorToDynamic();
      setDynamicSourceState("image");
      setActiveMonetImageId(imageId);
      setDynamicSeedHex(validHex);
      setEphemeralGameAccent(null);

      setMonetSavedImages((prev) => {
        const updated = prev.map((img) =>
          img.id === imageId ? { ...img, selected_hex: validHex } : img
        );
        persistTheme({
          accent_color: "dynamic",
          dynamic_source: "image",
          monet_saved_images: updated,
          active_monet_image_id: imageId,
          dynamic_seed_hex: validHex,
        });
        return updated;
      });
    },
    [onSetAccentColorToDynamic, persistTheme]
  );

  const removeMonetImage = useCallback(
    async (imageId: string) => {
      setMonetSavedImages((prev) => {
        const target = prev.find((img) => img.id === imageId);
        if (target) {
          configApi.deleteMonetWallpaperFile(target.image_path).catch(() => {});
        }

        const remaining = prev.filter((img) => img.id !== imageId);
        let nextActiveId = activeMonetImageId;
        let nextSource = dynamicSource;
        let nextSeed = dynamicSeedHex;

        if (activeMonetImageId === imageId) {
          if (remaining.length > 0) {
            nextActiveId = remaining[0].id;
            nextSeed = remaining[0].selected_hex;
          } else {
            nextActiveId = null;
            if (dynamicSource === "image") {
              nextSource = "windows";
              nextSeed = windowsAccentHex;
            }
          }
        }

        setActiveMonetImageId(nextActiveId);
        setDynamicSourceState(nextSource);
        setDynamicSeedHex(nextSeed);

        persistTheme({
          monet_saved_images: remaining,
          active_monet_image_id: nextActiveId,
          dynamic_source: nextSource,
          dynamic_seed_hex: nextSeed,
        });

        return remaining;
      });
    },
    [activeMonetImageId, dynamicSeedHex, dynamicSource, persistTheme, windowsAccentHex]
  );

  const setGameAdaptiveAccent = useCallback(
    async (enabled: boolean) => {
      setGameAdaptiveAccentState(enabled);
      if (!enabled) {
        setEphemeralGameAccent(null);
      }
      persistTheme({
        game_adaptive_accent: enabled,
      });
    },
    [persistTheme]
  );

  const applyEphemeralGameAccent = useCallback(
    (info: EphemeralGameAccentInfo | null) => {
      setEphemeralGameAccent((prev) => {
        if (!prev && !info) return prev;
        if (
          prev &&
          info &&
          prev.trainerId === info.trainerId &&
          prev.hex === info.hex
        ) {
          return prev;
        }
        return info;
      });
    },
    []
  );

  return {
    dynamicSource,
    windowsAccentHex,
    dynamicSeedHex,
    monetSavedImages,
    activeMonetImageId,
    gameAdaptiveAccent,
    ephemeralGameAccent,
    isExtractingMonet,
    setDynamicSourceState,
    setWindowsAccentHex,
    setDynamicSeedHex,
    setMonetSavedImages,
    setActiveMonetImageId,
    setGameAdaptiveAccentState,
    setEphemeralGameAccent,
    refreshWindowsAccent,
    enableDynamicColor,
    setDynamicSource,
    addMonetImagesFromFiles,
    addMonetImagesFromPaths,
    selectMonetImageSwatch,
    removeMonetImage,
    setGameAdaptiveAccent,
    applyEphemeralGameAccent,
  };
}
