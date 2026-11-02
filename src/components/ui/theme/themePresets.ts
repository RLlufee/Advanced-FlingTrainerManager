/**
 * @file themePresets.ts
 * @description 启动器个性化主题强调色（Accent Color）预设矩阵与颜色衍生算法
 */

import type { AccentColorKey } from "../../../services/configApi";

export interface AccentColorConfig {
  id: AccentColorKey | string;
  name: string;
  tagline: string;
  primary: string; // 主强调色 (Hex)
  hover: string; // 悬停色 (Hex)
  active: string; // 按压激活色 (Hex)
  text: string; // 高对比度文本色 (用于浅底文字)
  rgb: string; // "R, G, B" 便于透明度拼装
  soft: string; // 浅色半透明背景
  border: string; // 柔和边框
  glow: string; // 柔光阴影色
  gradient: string; // 渐变样式 (如用于大按钮或滑块)
}

export const ACCENT_PRESETS: Record<
  Exclude<AccentColorKey, "custom" | "dynamic">,
  AccentColorConfig
> = {
  cyan: {
    id: "cyan",
    name: "青空之蓝",
    tagline: "风灵月影与 PCL II 经典科技青蓝",
    primary: "#06b6d4",
    hover: "#0891b2",
    active: "#0e7490",
    text: "#0e7490",
    rgb: "6, 182, 212",
    soft: "rgba(6, 182, 212, 0.12)",
    border: "rgba(6, 182, 212, 0.35)",
    glow: "rgba(6, 182, 212, 0.35)",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
  },
  emerald: {
    id: "emerald",
    name: "翡翠清泉",
    tagline: "清新护眼与大自然生机翠绿",
    primary: "#10b981",
    hover: "#059669",
    active: "#047857",
    text: "#047857",
    rgb: "16, 185, 129",
    soft: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.35)",
    glow: "rgba(16, 185, 129, 0.35)",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  rose: {
    id: "rose",
    name: "落樱浅粉",
    tagline: "白凌最爱的温柔二次元樱花粉",
    primary: "#f43f5e",
    hover: "#e11d48",
    active: "#be123c",
    text: "#be123c",
    rgb: "244, 63, 94",
    soft: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.35)",
    glow: "rgba(244, 63, 94, 0.35)",
    gradient: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
  },
  violet: {
    id: "violet",
    name: "幻夜幽紫",
    tagline: "神秘高雅与赛博霓虹质感",
    primary: "#8b5cf6",
    hover: "#7c3aed",
    active: "#6d28d9",
    text: "#6d28d9",
    rgb: "139, 92, 246",
    soft: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.35)",
    glow: "rgba(139, 92, 246, 0.35)",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
  },
  amber: {
    id: "amber",
    name: "极客琥珀",
    tagline: "热血电竞与暖阳能量光芒",
    primary: "#f59e0b",
    hover: "#d97706",
    active: "#b45309",
    text: "#b45309",
    rgb: "245, 158, 11",
    soft: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
    glow: "rgba(245, 158, 11, 0.35)",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
  },
  gold: {
    id: "gold",
    name: "晨曦暖金",
    tagline: "璀璨明亮与破晓日出的黄金光华",
    primary: "#eab308",
    hover: "#ca8a04",
    active: "#a16207",
    text: "#a16207",
    rgb: "234, 179, 8",
    soft: "rgba(234, 179, 8, 0.12)",
    border: "rgba(234, 179, 8, 0.35)",
    glow: "rgba(234, 179, 8, 0.35)",
    gradient: "linear-gradient(135deg, #facc15 0%, #ca8a04 100%)",
  },
  indigo: {
    id: "indigo",
    name: "深邃墨蓝",
    tagline: "静谧沉着与商务极客风范",
    primary: "#6366f1",
    hover: "#4f46e5",
    active: "#4338ca",
    text: "#4338ca",
    rgb: "99, 102, 241",
    soft: "rgba(99, 102, 241, 0.12)",
    border: "rgba(99, 102, 241, 0.35)",
    glow: "rgba(99, 102, 241, 0.35)",
    gradient: "linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)",
  },
  monochrome: {
    id: "monochrome",
    name: "女仆黑白",
    tagline: "白凌专属黑白女仆装纯粹极简",
    primary: "#1e293b",
    hover: "#334155",
    active: "#0f172a",
    text: "#0f172a",
    rgb: "30, 41, 59",
    soft: "rgba(30, 41, 59, 0.08)",
    border: "rgba(30, 41, 59, 0.25)",
    glow: "rgba(30, 41, 59, 0.25)",
    gradient: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  },
};

/**
 * 校验并规范化 16 进制颜色 Hex
 */
export function normalizeHex(input: string): string | null {
  const clean = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean.toLowerCase()}`;
  }
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const expanded = clean
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return null;
}

/**
 * 从 Hex 颜色智能衍生完整的强调色配置
 */
export function deriveCustomAccent(hex: string): AccentColorConfig {
  const cleanHex = normalizeHex(hex) || "#06b6d4";
  const num = parseInt(cleanHex.slice(1), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  // 稍微压暗得到 hover 与 active
  const darken = (factor: number) => {
    const dr = Math.max(0, Math.floor(r * factor));
    const dg = Math.max(0, Math.floor(g * factor));
    const db = Math.max(0, Math.floor(b * factor));
    return `#${((1 << 24) + (dr << 16) + (dg << 8) + db).toString(16).slice(1)}`;
  };

  const hoverHex = darken(0.88);
  const activeHex = darken(0.75);
  const textHex = darken(0.7);

  return {
    id: "custom",
    name: "自定义强调色",
    tagline: `自定义十六进制色号 ${cleanHex}`,
    primary: cleanHex,
    hover: hoverHex,
    active: activeHex,
    text: textHex,
    rgb: `${r}, ${g}, ${b}`,
    soft: `rgba(${r}, ${g}, ${b}, 0.12)`,
    border: `rgba(${r}, ${g}, ${b}, 0.35)`,
    glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
    gradient: `linear-gradient(135deg, ${cleanHex} 0%, ${hoverHex} 100%)`,
  };
}

/**
 * 获取当前生效的色彩配置
 */
export function getActiveAccentConfig(
  accentId: string,
  customHex?: string | null
): AccentColorConfig {
  if (accentId === "custom" && customHex) {
    return deriveCustomAccent(customHex);
  }
  const preset = ACCENT_PRESETS[accentId as keyof typeof ACCENT_PRESETS];
  if (preset) {
    return preset;
  }
  return ACCENT_PRESETS.cyan;
}
