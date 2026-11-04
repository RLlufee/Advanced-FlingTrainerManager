import { AccentColorConfig, getActiveAccentConfig } from "./themePresets";
import { WallpaperLayersConfig } from "../../../services/configApi";
import { Hct, argbFromHex, hexFromArgb } from "@material/material-color-utilities";
import { getCachedThemeSnapshot } from "./themeStorage";

/**
 * 将色彩变量注入到 document.documentElement (:root)
 */
export function applyAccentToDom(accent: AccentColorConfig): void {
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

/**
 * 按 PCL-CE 的主题色相邻渐变思路，生成深浅模式各自舒适的三段背景色。
 */
export function applyAtmosphereToDom(
  accent: AccentColorConfig,
  isDark: boolean,
  gradientEnabled: boolean
): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const seed = Hct.fromInt(argbFromHex(accent.primary));
  const chroma = isDark
    ? Math.min(18, Math.max(7, seed.chroma * 0.38))
    : Math.min(14, Math.max(5, seed.chroma * 0.2));
  const tones = isDark ? [16, 20, 15] : [90, 96, 89];
  const hues = [seed.hue - 15, seed.hue, seed.hue + 17];
  const stops = hues.map((hue, index) =>
    hexFromArgb(Hct.from((hue + 360) % 360, chroma, tones[index]).toInt())
  );

  root.style.setProperty("--app-surface-base", isDark ? "#0b101b" : "#edf0f5");
  root.style.setProperty("--app-gradient-start", stops[0]);
  root.style.setProperty("--app-gradient-mid", stops[1]);
  root.style.setProperty("--app-gradient-end", stops[2]);
  root.style.setProperty(
    "--app-surface-card",
    isDark
      ? `color-mix(in oklab, #131c31 88%, ${accent.primary} 12%)`
      : "#ffffff"
  );
  root.style.setProperty(
    "--app-surface-inset",
    isDark
      ? `color-mix(in oklab, #182238 90%, ${accent.primary} 10%)`
      : "#f8fafc"
  );
  root.dataset.gradientBackground = String(gradientEnabled);
}

/**
 * 将壁纸穿透配置与图层透明度注入至 documentElement
 */
export function applyWallpaperToDom(
  wallpaperIsActive: boolean,
  wallpaperLayers: WallpaperLayersConfig,
  wallpaperSurfaceTransparency: number
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.dataset.wallpaperActive = String(wallpaperIsActive);
  root.dataset.wpSidebar = String(wallpaperLayers.sidebar);
  root.dataset.wpContent = String(wallpaperLayers.content);
  root.dataset.wpCards = String(wallpaperLayers.cards);
  root.dataset.wpTitlebar = String(wallpaperLayers.titlebar);
  root.dataset.wpModals = String(wallpaperLayers.modals);

  root.style.setProperty(
    "--app-wallpaper-surface-transparency",
    `${wallpaperSurfaceTransparency}%`
  );
  root.style.setProperty(
    "--app-wp-card-opacity",
    `${wallpaperLayers.card_opacity ?? 80}%`
  );
  root.style.setProperty(
    "--app-wp-sidebar-opacity",
    `${wallpaperLayers.sidebar_opacity ?? 75}%`
  );
  root.style.setProperty(
    "--app-wp-blur",
    `${wallpaperLayers.backdrop_blur ?? 12}px`
  );
}

// 预先同步 DOM 样式，0ms 彻底消除启动闪烁 (Anti-FOUC)
if (typeof document !== "undefined") {
  try {
    const cached = getCachedThemeSnapshot();
    if (cached) {
      const root = document.documentElement;
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
      const isDark = cached.color_mode === "dark" || (cached.color_mode !== "light" && prefersDark);
      root.classList.toggle("dark", isDark);
      root.setAttribute("data-theme", isDark ? "dark" : "light");
      root.setAttribute("data-color-mode", cached.color_mode || "system");
      root.style.colorScheme = isDark ? "dark" : "light";

      const accent = getActiveAccentConfig(cached.accent_color || "cyan", cached.custom_accent_hex || null);
      applyAccentToDom(accent);
      applyAtmosphereToDom(accent, isDark, cached.gradient_background ?? true);

      if (cached.wallpaper_enabled && cached.active_wallpaper_id) {
        root.dataset.wallpaperActive = "true";
      }
      if (cached.wallpaper_layers) {
        root.dataset.wpSidebar = String(cached.wallpaper_layers.sidebar ?? true);
        root.dataset.wpContent = String(cached.wallpaper_layers.content ?? true);
        root.dataset.wpCards = String(cached.wallpaper_layers.cards ?? false);
        root.dataset.wpTitlebar = String(cached.wallpaper_layers.titlebar ?? false);
        root.dataset.wpModals = String(cached.wallpaper_layers.modals ?? false);
        root.style.setProperty("--app-wp-card-opacity", `${cached.wallpaper_layers.card_opacity ?? 80}%`);
        root.style.setProperty("--app-wp-sidebar-opacity", `${cached.wallpaper_layers.sidebar_opacity ?? 75}%`);
        root.style.setProperty("--app-wp-blur", `${cached.wallpaper_layers.backdrop_blur ?? 12}px`);
      }
      if (typeof cached.wallpaper_surface_transparency === "number") {
        root.style.setProperty("--app-wallpaper-surface-transparency", `${cached.wallpaper_surface_transparency}%`);
      }
    }
  } catch {
    // 静默降级
  }
}
