/**
 * @file ThemeContext.tsx
 * @description 启动器主题色（Accent Color）与外观个性化上下文系统
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
} from "../../../services/configApi";
import {
  ACCENT_PRESETS,
  AccentColorConfig,
  getActiveAccentConfig,
  normalizeHex,
} from "./themePresets";

export interface ThemeContextValue {
  accentColor: string; // 预设 ID 如 "cyan" | "rose" 或 "custom"
  customHex: string; // 自定义 HEX (例如 "#06b6d4")
  currentAccent: AccentColorConfig;
  presets: AccentColorConfig[];
  setAccentColor: (colorId: string) => Promise<void>;
  setCustomHex: (hex: string) => Promise<void>;
  isCustom: boolean;
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
  // 数据属性便于 CSS 选择器定向覆盖
  root.setAttribute("data-accent", accent.id);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColorState] = useState<string>("cyan");
  const [customHex, setCustomHexState] = useState<string>("#06b6d4");
  const configRef = useRef<AppConfig | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // 计算当前生效的配色方案
  const currentAccent = useMemo(() => {
    return getActiveAccentConfig(accentColor, customHex);
  }, [accentColor, customHex]);

  // 1. 初始化时注入默认值到 DOM
  useEffect(() => {
    applyAccentToDom(currentAccent);
  }, [currentAccent]);

  // 2. 从后端加载配置
  useEffect(() => {
    const initTheme = async () => {
      try {
        const cfg = await configApi.getConfig();
        configRef.current = cfg;
        if (cfg.theme) {
          if (cfg.theme.accent_color) {
            setAccentColorState(cfg.theme.accent_color);
          }
          if (cfg.theme.custom_accent_hex) {
            setCustomHexState(cfg.theme.custom_accent_hex);
          }
        }
      } catch (e) {
        console.warn("读取主题配置失败，使用默认青空主题", e);
      }
    };
    initTheme();
  }, []);

  // 3. 自动持久化落盘
  const persistTheme = useCallback((newTheme: ThemeSettings) => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const latest = configRef.current || (await configApi.getConfig());
        const merged: AppConfig = {
          ...latest,
          theme: {
            ...latest.theme,
            ...newTheme,
          },
        };
        configRef.current = merged;
        await configApi.saveConfig(merged);
      } catch (err) {
        console.error("保存主题配色失败:", err);
      }
    }, 250);
  }, []);

  // 4. 设置预设主题色
  const setAccentColor = useCallback(
    async (colorId: string) => {
      setAccentColorState(colorId);
      persistTheme({
        accent_color: colorId,
        custom_accent_hex: colorId === "custom" ? customHex : null,
      });
    },
    [customHex, persistTheme]
  );

  // 5. 设置自定义 HEX 强调色
  const setCustomHex = useCallback(
    async (hex: string) => {
      const normalized = normalizeHex(hex) || hex;
      setCustomHexState(normalized);
      setAccentColorState("custom");
      persistTheme({
        accent_color: "custom",
        custom_accent_hex: normalized,
      });
    },
    [persistTheme]
  );

  const presets = useMemo(() => Object.values(ACCENT_PRESETS), []);

  const value: ThemeContextValue = {
    accentColor,
    customHex,
    currentAccent,
    presets,
    setAccentColor,
    setCustomHex,
    isCustom: accentColor === "custom",
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
