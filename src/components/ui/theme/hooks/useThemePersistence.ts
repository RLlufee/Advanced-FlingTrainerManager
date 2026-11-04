import { useRef, useCallback } from "react";
import { AppConfig, ThemeSettings, configApi } from "../../../../services/configApi";
import { saveCachedThemeSnapshot } from "../themeStorage";

export function useThemePersistence() {
  const configRef = useRef<AppConfig | null>(null);
  const pendingPatchRef = useRef<Partial<ThemeSettings>>({});
  const saveTimeoutRef = useRef<number | null>(null);

  const persistTheme = useCallback((patch: Partial<ThemeSettings>) => {
    saveCachedThemeSnapshot(patch);
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
        const latest = await configApi.getConfig();
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

  return { configRef, persistTheme };
}
