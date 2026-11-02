/**
 * @file monetEngine.ts
 * @description 基于 Google Material Design 3 (@material/material-color-utilities) 的莫奈动态取色与 HCT 调色盘衍生引擎
 */

import {
  Hct,
  QuantizerCelebi,
  Score,
  argbFromHex,
  argbFromRgb,
  blueFromArgb,
  greenFromArgb,
  hexFromArgb,
  redFromArgb,
} from "@material/material-color-utilities";
import { configApi } from "../../../services/configApi";
import { AccentColorConfig, normalizeHex } from "./themePresets";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * 游戏封面莫奈种子色内存缓存 (key: `${trainerId}::${primarySource}`)
 * 纯内存高速命中，切换回已浏览过的修改器耗时 0ms 且零磁盘 IO
 */
const gameMonetCache = new Map<string, string>();
const inflightGameExtractions = new Map<string, Promise<string>>();

/**
 * 利用 Google HCT (Hue-Chroma-Tone) 人眼感知色彩空间，从任意种子色衍生完整且符合 WCAG 对比度的主题变量集
 * 优势：
 * - 即使输入极亮色（如赛博朋克明黄 #fcee0a）或极暗色（如深海军蓝 #2c3752），
 *   HCT 也会在严格保持色相 (Hue) 不变的前提下将按钮主色调校至感知明度 Tone 45~55，
 *   确保白字按钮与浅底徽章文字 100% 清晰可读。
 */
export function deriveMonetAccent(
  seedHex: string,
  meta?: {
    id?: string;
    name?: string;
    tagline?: string;
  }
): AccentColorConfig {
  const cleanHex = normalizeHex(seedHex) || "#06b6d4";
  const seedArgb = argbFromHex(cleanHex);
  const seedHct = Hct.fromInt(seedArgb);

  const hue = seedHct.hue;
  // 若源色接近黑白极简色（chroma < 8），保留低彩度冷冽质感；否则适度补足彩度防止发灰发脏
  const isNearMonochrome = seedHct.chroma < 8;
  const effectiveChroma = isNearMonochrome
    ? Math.max(seedHct.chroma, 5)
    : clamp(seedHct.chroma, 34, 78);

  // 将主按钮明度约束在 HCT Tone [45, 55] 黄金区间：兼顾鲜活度与白色文字对比度 (ΔL* >= 45)
  const primaryTone = isNearMonochrome
    ? clamp(seedHct.tone, 24, 38)
    : clamp(seedHct.tone, 45, 55);

  const primaryArgb = Hct.from(hue, effectiveChroma, primaryTone).toInt();
  const hoverArgb = Hct.from(hue, effectiveChroma, Math.max(18, primaryTone - 7)).toInt();
  const activeArgb = Hct.from(hue, effectiveChroma, Math.max(12, primaryTone - 14)).toInt();
  // 浅底文字与胶囊高亮文字采用 Tone 30，在浅色半透明底上恒定满足 WCAG AAA 对比度
  const textArgb = Hct.from(hue, Math.min(effectiveChroma, 58), isNearMonochrome ? 18 : 30).toInt();

  // M3 微邻近色相渐变：起点微亮 +6 Tone，终点色相微偏 +10° 且压暗 -10 Tone，质感通透立体
  const gradStartArgb = Hct.from(
    hue,
    isNearMonochrome ? effectiveChroma : Math.min(effectiveChroma * 1.08, 84),
    Math.min(primaryTone + 6, 61)
  ).toInt();
  const gradEndArgb = Hct.from(
    (hue + (isNearMonochrome ? 0 : 10)) % 360,
    effectiveChroma,
    Math.max(primaryTone - 10, 22)
  ).toInt();

  const primary = hexFromArgb(primaryArgb);
  const hover = hexFromArgb(hoverArgb);
  const active = hexFromArgb(activeArgb);
  const text = hexFromArgb(textArgb);
  const gradStart = hexFromArgb(gradStartArgb);
  const gradEnd = hexFromArgb(gradEndArgb);

  const r = redFromArgb(primaryArgb);
  const g = greenFromArgb(primaryArgb);
  const b = blueFromArgb(primaryArgb);

  return {
    id: meta?.id || "dynamic",
    name: meta?.name || "莫奈动态强调色",
    tagline: meta?.tagline || `基于种子色 ${cleanHex} 的 HCT 感知调色方案`,
    primary,
    hover,
    active,
    text,
    rgb: `${r}, ${g}, ${b}`,
    soft: `rgba(${r}, ${g}, ${b}, 0.12)`,
    border: `rgba(${r}, ${g}, ${b}, 0.34)`,
    glow: `rgba(${r}, ${g}, ${b}, 0.36)`,
    gradient: `linear-gradient(135deg, ${gradStart} 0%, ${gradEnd} 100%)`,
  };
}

/**
 * 将 Data URL / Blob URL 加载为 HTMLImageElement
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片解码加载失败"));
    img.src = src;
  });
}

/**
 * 从 HTMLImageElement 下采样提取像素，并运行 Google Celebi 量化聚类与莫奈美学评分 (Score)
 */
function quantizeAndScoreImage(img: HTMLImageElement, maxDim = 112, desiredCount = 6): string[] {
  const naturalW = img.naturalWidth || img.width || 112;
  const naturalH = img.naturalHeight || img.height || 112;
  const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return ["#06b6d4"];
  }

  ctx.drawImage(img, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;

  const pixels: number[] = [];
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3];
    if (a < 128) continue;
    pixels.push(argbFromRgb(rgba[i], rgba[i + 1], rgba[i + 2]));
  }

  if (pixels.length === 0) {
    return ["#06b6d4"];
  }

  // 1. Wu + WSMeans (Celebi) 聚类量化为最多 128 个代表色簇
  const quantized = QuantizerCelebi.quantize(pixels, 128);

  // 2. Google Material You 美学评分排序（自动剔除脏灰与极低面积杂色）
  const FALLBACK_SENTINEL = 0xff06b6d4;
  let scored = Score.score(quantized, {
    desired: desiredCount,
    fallbackColorARGB: FALLBACK_SENTINEL,
    filter: true,
  });

  // 若原图整体偏冷峻黑白/极低饱和导致被全部过滤，则放宽 filter 提取真实低饱和基调
  if (scored.length === 1 && scored[0] === FALLBACK_SENTINEL && !quantized.has(FALLBACK_SENTINEL)) {
    scored = Score.score(quantized, {
      desired: desiredCount,
      fallbackColorARGB: 0xff475569,
      filter: false,
    });
  }

  const hexList = scored.map((argb) => hexFromArgb(argb));

  // 若单色插画提取出的色相不足 4 个，利用 HCT 邻近色与互补色智能补齐候选色票，方便折腾玩家挑选
  if (hexList.length > 0 && hexList.length < Math.min(4, desiredCount)) {
    const baseHct = Hct.fromInt(argbFromHex(hexList[0]));
    const hueOffsets = [32, 328, 65, 180];
    for (const offset of hueOffsets) {
      if (hexList.length >= Math.min(5, desiredCount)) break;
      const derivedHex = hexFromArgb(
        Hct.from(
          (baseHct.hue + offset) % 360,
          clamp(baseHct.chroma, 36, 68),
          clamp(baseHct.tone, 48, 56)
        ).toInt()
      );
      if (!hexList.includes(derivedHex)) {
        hexList.push(derivedHex);
      }
    }
  }

  return Array.from(new Set(hexList)).slice(0, desiredCount);
}

/**
 * 生成高清轻量预览缩略图 Data URL (最大边长 480px，JPEG 0.85 质量，单张仅 ~30KB)
 * 用于持久化存储至 app_data/theme_wallpapers/，不膨胀配置文件且原图移动后永不失效
 */
function buildThumbnailDataUrl(img: HTMLImageElement, maxEdge = 480): string {
  const naturalW = img.naturalWidth || img.width || 320;
  const naturalH = img.naturalHeight || img.height || 180;
  const scale = Math.min(1, maxEdge / Math.max(naturalW, naturalH));
  const w = Math.max(1, Math.round(naturalW * scale));
  const h = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 铺一层白底防止透明 PNG 转 JPEG 时变纯黑
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * 从图片 Data URL 中提取 6 枚莫奈推荐色票，并生成持久化缩略图
 */
export async function extractMonetFromDataUrl(
  dataUrl: string,
  desiredCount = 6
): Promise<{
  palette: string[];
  thumbnailDataUrl: string;
}> {
  const img = await loadImageElement(dataUrl);
  const palette = quantizeAndScoreImage(img, 112, desiredCount);
  const thumbnailDataUrl = buildThumbnailDataUrl(img, 480);
  return { palette, thumbnailDataUrl };
}

/**
 * 读取浏览器 File 对象为 Data URL
 */
export function readFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("读取图片文件流结果异常"));
      }
    };
    reader.onerror = () => reject(new Error("读取图片文件失败"));
    reader.readAsDataURL(file);
  });
}

/**
 * 当离线导入的无封面修改器没有任何图片时，根据游戏名哈希稳定衍生一枚专属 HCT 莫奈色
 */
function fallbackColorFromGameTitle(title: string): string {
  let hash = 2166136261;
  for (let i = 0; i < title.length; i++) {
    hash ^= title.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hue = Math.abs(hash) % 360;
  return hexFromArgb(Hct.from(hue, 52, 50).toInt());
}

/**
 * 过滤有效的游戏图片候选源（优先本地 cover.jpg，其次宽屏 Hero / 官网缩略图）
 */
function cleanImageCandidates(sources: Array<string | null | undefined>): string[] {
  const valid = sources.filter((src): src is string =>
    Boolean(
      src &&
        src.trim() &&
        !src.includes("gravatar.com") &&
        !src.includes("avatar") &&
        !src.includes("tooltip-icon") &&
        !src.toLowerCase().endsWith(".gif")
    )
  );
  return Array.from(new Set(valid));
}

/**
 * 提取指定修改器游戏封面的莫奈代表色（带内存缓存与并发去重，已命中游戏 0ms 返回）
 */
export async function extractGameMonetHex(
  trainerId: string,
  gameTitle: string,
  candidateSources: Array<string | null | undefined>
): Promise<string> {
  const candidates = cleanImageCandidates(candidateSources);
  const cacheKey = `${trainerId}::${candidates[0] || gameTitle}`;

  const cached = gameMonetCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const inflight = inflightGameExtractions.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const task = (async () => {
    for (const src of candidates) {
      try {
        const dataUrl = await configApi.readImageAsDataUrl(src);
        const img = await loadImageElement(dataUrl);
        const palette = quantizeAndScoreImage(img, 96, 2);
        if (palette.length > 0) {
          gameMonetCache.set(cacheKey, palette[0]);
          return palette[0];
        }
      } catch {
        // 当前图片源不可用时静默降级尝试下一个候选源
      }
    }

    const fallback = fallbackColorFromGameTitle(gameTitle || trainerId);
    gameMonetCache.set(cacheKey, fallback);
    return fallback;
  })();

  inflightGameExtractions.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inflightGameExtractions.delete(cacheKey);
  }
}
