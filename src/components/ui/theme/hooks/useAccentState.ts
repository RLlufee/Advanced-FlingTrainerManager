import { useState, useMemo, useCallback, useEffect } from "react";
import { ThemeSettings, DynamicColorSource, MonetSavedImage } from "../../../../services/configApi";
import {
  AccentColorConfig,
  getActiveAccentConfig,
  normalizeHex,
} from "../themePresets";
import { deriveMonetAccent } from "../monetEngine";
import { applyAccentToDom, applyAtmosphereToDom } from "../themeDomApplier";
import { EphemeralGameAccentInfo } from "./useMonetState";

interface UseAccentStateProps {
  initialAccentColor?: string;
  initialCustomHex?: string;
  dynamicSource: DynamicColorSource;
  windowsAccentHex: string;
  dynamicSeedHex: string | null;
  monetSavedImages: MonetSavedImage[];
  activeMonetImageId: string | null;
  gameAdaptiveAccent: boolean;
  ephemeralGameAccent: EphemeralGameAccentInfo | null;
  isDark: boolean;
  gradientBackground: boolean;
  onClearEphemeralGameAccent: () => void;
  persistTheme: (patch: Partial<ThemeSettings>) => void;
}

export function useAccentState({
  initialAccentColor = "cyan",
  initialCustomHex = "#06b6d4",
  dynamicSource,
  windowsAccentHex,
  dynamicSeedHex,
  monetSavedImages,
  activeMonetImageId,
  gameAdaptiveAccent,
  ephemeralGameAccent,
  isDark,
  gradientBackground,
  onClearEphemeralGameAccent,
  persistTheme,
}: UseAccentStateProps) {
  const [accentColor, setAccentColorState] = useState<string>(initialAccentColor);
  const [customHex, setCustomHexState] = useState<string>(initialCustomHex);

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

  // 颜色变化时 0ms 写入 DOM CSS 变量
  useEffect(() => {
    applyAccentToDom(currentAccent);
  }, [currentAccent]);

  useEffect(() => {
    applyAtmosphereToDom(currentAccent, isDark, gradientBackground);
  }, [currentAccent, isDark, gradientBackground]);

  // 切换固定预设主题色
  const setAccentColor = useCallback(
    async (colorId: string) => {
      setAccentColorState(colorId);
      if (colorId !== "dynamic") {
        onClearEphemeralGameAccent();
      }
      persistTheme({
        accent_color: colorId,
        custom_accent_hex: colorId === "custom" ? customHex : null,
      });
    },
    [customHex, onClearEphemeralGameAccent, persistTheme]
  );

  // 设置手动输入的自定义 HEX 强调色
  const setCustomHex = useCallback(
    async (hex: string) => {
      const normalized = normalizeHex(hex) || hex;
      setCustomHexState(normalized);
      setAccentColorState("custom");
      onClearEphemeralGameAccent();
      persistTheme({
        accent_color: "custom",
        custom_accent_hex: normalized,
      });
    },
    [onClearEphemeralGameAccent, persistTheme]
  );

  return {
    accentColor,
    customHex,
    currentAccent,
    setAccentColorState,
    setCustomHexState,
    setAccentColor,
    setCustomHex,
  };
}
