import { useState, useEffect, useMemo, useCallback } from "react";
import { ColorMode, ThemeSettings } from "../../../../services/configApi";

interface UseColorModeStateProps {
  initialColorMode?: ColorMode;
  initialGradientBackground?: boolean;
  persistTheme: (patch: Partial<ThemeSettings>) => void;
}

export function useColorModeState({
  initialColorMode = "system",
  initialGradientBackground = true,
  persistTheme,
}: UseColorModeStateProps) {
  const [colorMode, setColorModeState] = useState<ColorMode>(initialColorMode);
  const [gradientBackground, setGradientBackgroundState] = useState<boolean>(initialGradientBackground);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // 监听系统深色模式偏好实时变化
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemPrefersDark(e.matches);
    };
    handleSystemChange(mq);

    if (mq.addEventListener) {
      mq.addEventListener("change", handleSystemChange);
      return () => mq.removeEventListener("change", handleSystemChange);
    } else if ((mq as any).addListener) {
      (mq as any).addListener(handleSystemChange);
      return () => (mq as any).removeListener(handleSystemChange);
    }
  }, []);

  // 解析最终生效的深浅模式
  const isDark = useMemo<boolean>(() => {
    if (colorMode === "dark") return true;
    if (colorMode === "light") return false;
    return systemPrefersDark;
  }, [colorMode, systemPrefersDark]);

  const resolvedColorMode: "light" | "dark" = isDark ? "dark" : "light";

  // 同步暗色类名与属性至 documentElement (:root)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    root.setAttribute("data-color-mode", colorMode);
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark, colorMode]);

  // 切换深浅色彩外观模式
  const setColorMode = useCallback(
    async (mode: ColorMode) => {
      setColorModeState(mode);
      persistTheme({ color_mode: mode });
    },
    [persistTheme]
  );

  const toggleColorMode = useCallback(async () => {
    const nextMode: ColorMode =
      colorMode === "system" ? "light" : colorMode === "light" ? "dark" : "system";
    await setColorMode(nextMode);
  }, [colorMode, setColorMode]);

  const setGradientBackground = useCallback(
    async (enabled: boolean) => {
      setGradientBackgroundState(enabled);
      persistTheme({ gradient_background: enabled });
    },
    [persistTheme]
  );

  return {
    colorMode,
    resolvedColorMode,
    isDark,
    gradientBackground,
    setColorModeState,
    setGradientBackgroundState,
    setColorMode,
    toggleColorMode,
    setGradientBackground,
  };
}
