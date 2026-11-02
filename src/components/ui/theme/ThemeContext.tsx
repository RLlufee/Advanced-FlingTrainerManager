/**
 * @file ThemeContext.tsx
 * @description 启动器主题色（Accent Color）、莫奈动态取色（Windows 系统色 / 自定义图片画廊 / 游戏封面实时联动）上下文中枢
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  configApi,
  AppConfig,
  ThemeSettings,
  DynamicColorSource,
  MonetSavedImage,
} from "../../../services/configApi";
import {
  ACCENT_PRESETS,
  AccentColorConfig,
  getActiveAccentConfig,
  normalizeHex,
} from "./themePresets";
import {
  deriveMonetAccent,
  extractMonetFromDataUrl,
  readFileToDataUrl,
} from "./monetEngine";

export interface EphemeralGameAccentInfo {
  trainerId: string;
  trainerName: string;
  hex: string;
}

export interface ThemeContextValue {
  accentColor: string; // 预设 ID 如 "cyan" | "rose" | "custom" | "dynamic"
  customHex: string; // 自定义 HEX (例如 "#06b6d4")
  currentAccent: AccentColorConfig;
  presets: AccentColorConfig[];
  isCustom: boolean;
  isDynamic: boolean;

  // --- 莫奈三级动态取色状态 ---
  dynamicSource: DynamicColorSource;
  windowsAccentHex: string;
  monetSavedImages: MonetSavedImage[];
  activeMonetImageId: string | null;
  gameAdaptiveAccent: boolean;
  ephemeralGameAccent: EphemeralGameAccentInfo | null;
  isExtractingMonet: boolean;

  // --- 操作方法 ---
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

/**
 * 将色彩变量注入到 document.documentElement (:root)
 */
function applyAccentToDom(accent: AccentColorConfig) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-primary", accent.primary);
  root.style.setProperty("--color-primary-hover", accent.hover);
  root.style.setProperty("--color-primary-active", accent.active);
  root.style.setProperty("--color-primary-text", accent.text);
  root.style.setProperty("--color-primary-rgb", accent.rgb);
  root.style.setProperty("--color-primary-soft", accent.soft);
  root.style.setProperty("--color-primary-border", accent.border);
  root.style.setProperty("--color-primary-glow", accent.glow);
  root.style.setProperty("--color-primary-gradient", accent.gradient);
  root.setAttribute("data-accent", accent.id);
}

const SUPPORTED_IMAGE_EXT = /\.(png|jpe?g|webp|bmp)$/i;

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColorState] = useState<string>("cyan");
  const [customHex, setCustomHexState] = useState<string>("#06b6d4");

  // 莫奈三级动态取色状态
  const [dynamicSource, setDynamicSourceState] = useState<DynamicColorSource>("windows");
  const [windowsAccentHex, setWindowsAccentHex] = useState<string>("#0078d4");
  const [dynamicSeedHex, setDynamicSeedHex] = useState<string | null>(null);
  const [monetSavedImages, setMonetSavedImages] = useState<MonetSavedImage[]>([]);
  const [activeMonetImageId, setActiveMonetImageId] = useState<string | null>(null);
  const [gameAdaptiveAccent, setGameAdaptiveAccentState] = useState<boolean>(false);
  const [ephemeralGameAccent, setEphemeralGameAccent] =
    useState<EphemeralGameAccentInfo | null>(null);
  const [isExtractingMonet, setIsExtractingMonet] = useState<boolean>(false);

  const configRef = useRef<AppConfig | null>(null);
  const pendingPatchRef = useRef<Partial<ThemeSettings>>({});
  const saveTimeoutRef = useRef<number | null>(null);

  // 计算当前最终生效的强调色配置
  const currentAccent = useMemo<AccentColorConfig>(() => {
    if (accentColor === "dynamic") {
      // 第三级最高瞬态优先级：游戏取色（启动页实时跟随选中的修改器封面）
      if (gameAdaptiveAccent && ephemeralGameAccent) {
        return deriveMonetAccent(ephemeralGameAccent.hex, {
          id: "dynamic",
          name: `游戏取色 · ${ephemeralGameAccent.trainerName}`,
          tagline: `莫奈实时提取自游戏封面 (${ephemeralGameAccent.hex})`,
        });
      }

      // 第二级：用户导入的莫奈图片画廊色票
      if (dynamicSource === "image" && monetSavedImages.length > 0) {
        const activeImg =
          monetSavedImages.find((img) => img.id === activeMonetImageId) ||
          monetSavedImages[0];
        if (activeImg) {
          return deriveMonetAccent(activeImg.selected_hex, {
            id: "dynamic",
            name: `图片取色 · ${activeImg.name}`,
            tagline: `莫奈 HCT 调色板 (${activeImg.selected_hex})`,
          });
        }
      }

      // 第一级（默认）：Windows 系统主题强调色
      const winSeed = windowsAccentHex || dynamicSeedHex || "#0078d4";
      return deriveMonetAccent(winSeed, {
        id: "dynamic",
        name: "Windows 系统动态色",
        tagline: `自动同步 Windows 主题强调色 (${winSeed})`,
      });
    }

    return getActiveAccentConfig(accentColor, customHex);
  }, [
    accentColor,
    customHex,
    dynamicSource,
    windowsAccentHex,
    dynamicSeedHex,
    monetSavedImages,
    activeMonetImageId,
    gameAdaptiveAccent,
    ephemeralGameAccent,
  ]);

  // 1. 颜色变化时 0ms 写入 DOM CSS 变量
  useEffect(() => {
    applyAccentToDom(currentAccent);
  }, [currentAccent]);

  // 2. 防丢失合并式防抖持久化落盘（支持同一帧内连续多次局部字段更新而不互相覆盖）
  const persistTheme = useCallback((patch: Partial<ThemeSettings>) => {
    pendingPatchRef.current = {
      ...pendingPatchRef.current,
      ...patch,
    };

    if (configRef.current) {
      configRef.current = {
        ...configRef.current,
        theme: {
          accent_color: configRef.current.theme?.accent_color || "cyan",
          ...configRef.current.theme,
          ...pendingPatchRef.current,
        },
      };
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      const patchToFlush = pendingPatchRef.current;
      pendingPatchRef.current = {};
      try {
        const latest = configRef.current || (await configApi.getConfig());
        const merged: AppConfig = {
          ...latest,
          theme: {
            accent_color: latest.theme?.accent_color || "cyan",
            ...latest.theme,
            ...patchToFlush,
          },
        };
        configRef.current = merged;
        await configApi.saveConfig(merged);
      } catch (err) {
        console.error("保存主题配色配置失败:", err);
      }
    }, 200);
  }, []);

  // 3. 初始化加载全局配置 + Windows 系统强调色
  useEffect(() => {
    let mounted = true;
    const initTheme = async () => {
      // 并行读取持久配置与当前 Windows DWM 强调色
      const [cfgRes, winRes] = await Promise.allSettled([
        configApi.getConfig(),
        configApi.getWindowsAccentColor(),
      ]);

      if (!mounted) return;

      let detectedWinHex = "#0078d4";
      if (winRes.status === "fulfilled" && winRes.value) {
        detectedWinHex = normalizeHex(winRes.value) || "#0078d4";
        setWindowsAccentHex(detectedWinHex);
      }

      if (cfgRes.status === "fulfilled") {
        const cfg = cfgRes.value;
        configRef.current = cfg;
        const t = cfg.theme;
        if (t) {
          if (t.accent_color) setAccentColorState(t.accent_color);
          if (t.custom_accent_hex) setCustomHexState(t.custom_accent_hex);
          if (t.dynamic_source === "windows" || t.dynamic_source === "image") {
            setDynamicSourceState(t.dynamic_source);
          }
          if (Array.isArray(t.monet_saved_images)) {
            setMonetSavedImages(t.monet_saved_images);
          }
          if (t.active_monet_image_id !== undefined) {
            setActiveMonetImageId(t.active_monet_image_id ?? null);
          }
          if (t.dynamic_seed_hex) {
            setDynamicSeedHex(t.dynamic_seed_hex);
          }
          if (typeof t.game_adaptive_accent === "boolean") {
            setGameAdaptiveAccentState(t.game_adaptive_accent);
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

  // 4. 切换固定预设主题色
  const setAccentColor = useCallback(
    async (colorId: string) => {
      setAccentColorState(colorId);
      if (colorId !== "dynamic") {
        setEphemeralGameAccent(null);
      }
      persistTheme({
        accent_color: colorId,
        custom_accent_hex: colorId === "custom" ? customHex : null,
      });
    },
    [customHex, persistTheme]
  );

  // 5. 设置手动输入的自定义 HEX 强调色
  const setCustomHex = useCallback(
    async (hex: string) => {
      const normalized = normalizeHex(hex) || hex;
      setCustomHexState(normalized);
      setAccentColorState("custom");
      setEphemeralGameAccent(null);
      persistTheme({
        accent_color: "custom",
        custom_accent_hex: normalized,
      });
    },
    [persistTheme]
  );

  // 6. 刷新读取最新的 Windows 系统主题强调色
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

  // 7. 一键开启莫奈动态取色模式
  const enableDynamicColor = useCallback(async () => {
    setAccentColorState("dynamic");
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
    persistTheme,
    refreshWindowsAccent,
  ]);

  // 8. 切换动态取色基础源 ("windows" | "image")
  const setDynamicSource = useCallback(
    async (source: DynamicColorSource) => {
      setAccentColorState("dynamic");
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
          // 最多保留 16 张高清取色卡片，超出自动清理最早期的缩略图文件
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

        setAccentColorState("dynamic");
        setDynamicSourceState("image");
        setActiveMonetImageId(firstNew.id);
        setDynamicSeedHex(firstNew.selected_hex);
        setEphemeralGameAccent(null);

        return newlyCreated.length;
      } finally {
        setIsExtractingMonet(false);
      }
    },
    [persistTheme]
  );

  // 9. 从浏览器 File[] 批量导入图片莫奈取色（支持点击选择与 DOM 拖放）
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

  // 10. 从本地文件系统路径数组批量导入图片莫奈取色（兼容 Tauri 原生窗口拖放事件）
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

  // 11. 点选已保存图片卡片上的任意一枚莫奈色票
  const selectMonetImageSwatch = useCallback(
    async (imageId: string, hex: string) => {
      const validHex = normalizeHex(hex) || hex;
      setAccentColorState("dynamic");
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
    [persistTheme]
  );

  // 12. 删除某张已保存的莫奈取色图片（同步清理本地缩略图文件与配置项）
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

  // 13. 开启/关闭第三级「游戏取色」联动
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

  // 14. 运行时注入/清除游戏封面瞬态主题色（纯内存操作，绝不触发磁盘写盘）
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

  const presets = useMemo(() => Object.values(ACCENT_PRESETS), []);

  const value: ThemeContextValue = {
    accentColor,
    customHex,
    currentAccent,
    presets,
    isCustom: accentColor === "custom",
    isDynamic: accentColor === "dynamic",
    dynamicSource,
    windowsAccentHex,
    monetSavedImages,
    activeMonetImageId,
    gameAdaptiveAccent,
    ephemeralGameAccent,
    isExtractingMonet,
    setAccentColor,
    setCustomHex,
    enableDynamicColor,
    refreshWindowsAccent,
    setDynamicSource,
    addMonetImagesFromFiles,
    addMonetImagesFromPaths,
    selectMonetImageSwatch,
    removeMonetImage,
    setGameAdaptiveAccent,
    applyEphemeralGameAccent,
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
