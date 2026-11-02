/**
 * @file AppearanceTab.tsx
 * @description 设置中心 - 启动器外观与个性化皮肤主题中枢（含 Google Material You 莫奈三级动态取色系统）
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  Check,
  Pipette,
  Sparkles,
  Download,
  ShieldCheck,
  Layers,
  Heart,
  Sun,
  Image as ImageIcon,
  RotateCcw,
  Wand2,
  Monitor,
  Upload,
  Trash2,
  Gamepad2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useTheme } from "../ui/theme";
import { useAnimationConfig } from "../ui/motion/AnimationContext";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { FluidSlider } from "../ui/motion/FluidSlider";
import { normalizeHex } from "../ui/theme/themePresets";
import { configApi } from "../../services/configApi";

/**
 * 莫奈画廊持久化缩略图组件（优先走 Tauri asset 协议，失败时回退后端 DataURL 读取）
 */
const MonetThumbnail: React.FC<{ imagePath: string; alt: string }> = ({
  imagePath,
  alt,
}) => {
  const [src, setSrc] = useState<string>(() => {
    try {
      return convertFileSrc(imagePath);
    } catch {
      return imagePath;
    }
  });
  const [fallbackTried, setFallbackTried] = useState(false);

  useEffect(() => {
    setFallbackTried(false);
    try {
      setSrc(convertFileSrc(imagePath));
    } catch {
      setSrc(imagePath);
    }
  }, [imagePath]);

  const handleError = async () => {
    if (fallbackTried) return;
    setFallbackTried(true);
    try {
      const dataUrl = await configApi.readImageAsDataUrl(imagePath);
      setSrc(dataUrl);
    } catch {
      // 忽略异常
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
      loading="lazy"
    />
  );
};

export const AppearanceTab: React.FC = () => {
  const {
    accentColor,
    customHex,
    currentAccent,
    presets,
    isCustom,
    isDynamic,
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
  } = useTheme();

  const { isAnimEnabled, effectiveSpeed } = useAnimationConfig();

  // 自定义十六进制输入框本地状态
  const [hexInput, setHexInput] = useState<string>(customHex || "#06b6d4");
  const [previewSliderVal, setPreviewSliderVal] = useState<number>(68);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isRefreshingWin, setIsRefreshingWin] = useState<boolean>(false);
  const [advancedCollapsed, setAdvancedCollapsed] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // 当重新点击切换到动态取色时，自动展开高级抽屉
  useEffect(() => {
    if (isDynamic) {
      setAdvancedCollapsed(false);
    }
  }, [isDynamic]);

  // 接入 Tauri v2 原生系统文件拖放监听（仅当本面板处于可见激活态且动态抽屉展开时接管）
  useEffect(() => {
    if (!isDynamic || advancedCollapsed) return;

    let unlisten: (() => void) | null = null;
    let disposed = false;

    const setupTauriDrop = async () => {
      try {
        const fn = await getCurrentWebview().onDragDropEvent(async (event) => {
          // Keep-alive 保护：如果当前 Tab 被 display: none 隐藏，则不响应拖放
          if (!dropzoneRef.current || dropzoneRef.current.offsetParent === null) {
            return;
          }
          const payload = event.payload;
          if (payload.type === "enter" || payload.type === "over") {
            setIsDraggingOver(true);
          } else if (payload.type === "leave") {
            setIsDraggingOver(false);
          } else if (payload.type === "drop") {
            setIsDraggingOver(false);
            if (payload.paths && payload.paths.length > 0) {
              await addMonetImagesFromPaths(payload.paths);
            }
          }
        });

        if (disposed) {
          fn();
        } else {
          unlisten = fn;
        }
      } catch {
        // 非 Tauri WebView 环境下静默跳过，使用标准 DOM onDrop 即可
      }
    };

    setupTauriDrop();
    return () => {
      disposed = true;
      if (unlisten) unlisten();
    };
  }, [isDynamic, advancedCollapsed, addMonetImagesFromPaths]);

  const handleHexSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const valid = normalizeHex(hexInput);
    if (valid) {
      setCustomHex(valid);
    }
  };

  const handleRefreshWinColor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshingWin(true);
    try {
      await refreshWindowsAccent();
      await setDynamicSource("windows");
    } finally {
      setTimeout(() => setIsRefreshingWin(false), 350);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await addMonetImagesFromFiles(files);
    }
    e.target.value = "";
  };

  const handleDomDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length > 0) {
      await addMonetImagesFromFiles(files);
    }
  };

  return (
    <PaperContainer staggerDelay={0.05} className="space-y-6">
      {/* 头部标题与引导 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <JellyIcon intensity="gentle">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs transition-colors duration-300"
                style={{ backgroundColor: currentAccent.primary }}
              >
                <Palette className="w-4 h-4" />
              </div>
            </JellyIcon>
            <span>外观与个性化主题</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium transition-colors duration-300"
              style={{
                backgroundColor: currentAccent.soft,
                color: currentAccent.text,
                border: `1px solid ${currentAccent.border}`,
              }}
            >
              0ms 实时全域换肤
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            定制启动器全局核心强调色与莫奈动态取色引擎，配置自动持久化保存并在全站即时生效喵~
          </p>
        </div>

        {/* 一键恢复默认配色 */}
        <TypewriterTooltip text="将主题强调色恢复为官方经典青空之蓝" position="top">
          <button
            onClick={() => {
              setAccentColor("cyan");
              setHexInput("#06b6d4");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认青蓝</span>
          </button>
        </TypewriterTooltip>
      </div>

      {/* 卡片 1：主题强调色矩阵调色盘 + 莫奈动态取色 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">官方推荐强调色调色盘</h3>
            <span className="text-[11px] text-slate-400">
              （8 款固定色系 + 莫奈智能动态取色）
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
            <span>当前生效:</span>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shadow-2xs"
              style={{ backgroundColor: currentAccent.primary }}
            />
            <strong className="text-slate-800">{currentAccent.primary}</strong>
          </span>
        </div>

        {/* 8 种预设色卡网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presets.map((p) => {
            const isSelected = accentColor === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setAccentColor(p.id)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none ${
                  isSelected
                    ? "bg-slate-50/80 shadow-xs"
                    : "bg-white hover:bg-slate-50/60 border-slate-200/70 hover:border-slate-300"
                }`}
                style={{
                  borderColor: isSelected ? p.primary : undefined,
                  boxShadow: isSelected ? `0 0 0 1.5px ${p.primary}` : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <JellyIcon intensity="gentle">
                    <div
                      className="w-7 h-7 rounded-full shadow-xs flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        background: p.gradient,
                        boxShadow: `0 2px 8px ${p.glow}`,
                      }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                    </div>
                  </JellyIcon>

                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600">
                    {p.primary}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {isSelected && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: p.primary }}
                      />
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5" title={p.tagline}>
                    {p.tagline}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* =============== 核心新增：莫奈「动态取色」入口 + 动画弹出高级抽屉 =============== */}
        <div className="pt-2 space-y-3">
          {/* 第一级入口：不折腾玩家一键开启，自动同步 Windows 系统强调色 */}
          <div
            onClick={() => {
              if (!isDynamic) {
                enableDynamicColor();
              } else {
                setAdvancedCollapsed((prev) => !prev);
              }
            }}
            className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
              isDynamic
                ? "bg-primary-soft/60 shadow-xs"
                : "bg-slate-50/70 hover:bg-slate-50 border-slate-200/80 hover:border-slate-300"
            }`}
            style={{
              borderColor: isDynamic ? currentAccent.primary : undefined,
              boxShadow: isDynamic ? `0 0 0 1.5px ${currentAccent.primary}` : undefined,
            }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <JellyIcon intensity="bouncy">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-all duration-300"
                  style={{
                    background: isDynamic
                      ? currentAccent.gradient
                      : "conic-gradient(from 45deg, #06b6d4, #8b5cf6, #f43f5e, #f59e0b, #10b981, #06b6d4)",
                    boxShadow: isDynamic
                      ? `0 3px 10px ${currentAccent.glow}`
                      : "0 2px 8px rgba(139, 92, 246, 0.25)",
                  }}
                >
                  {isDynamic ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </div>
              </JellyIcon>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-slate-900">
                    动态取色 (Google Monet / Material You)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 text-slate-600 border border-slate-200/80">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: windowsAccentHex }}
                    />
                    <span>Win 系统色 {windowsAccentHex}</span>
                  </span>
                  {isDynamic && gameAdaptiveAccent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary text-white shadow-2xs">
                      游戏取色已开启
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {isDynamic
                    ? `当前生效：${currentAccent.name} · 点击可折叠/展开下方高级莫奈选项`
                    : "省心默认自动同步 Windows 系统主题色；选中后可展开「图片莫奈取色」与「启动页游戏取色」喵~"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isDynamic ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 group-hover:border-slate-300 shadow-2xs transition-all">
                  开启动态取色
                </span>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
                  <span>{advancedCollapsed ? "展开高级选项" : "收起高级选项"}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      advancedCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 第二级 & 第三级：选中「动态取色」后丝滑动画弹出的高级定制抽屉 */}
          <AnimatePresence initial={false}>
            {isDynamic && !advancedCollapsed && (
              <motion.div
                key="monet-advanced-drawer"
                initial={
                  isAnimEnabled
                    ? { height: 0, opacity: 0 }
                    : { height: "auto", opacity: 1 }
                }
                animate={{ height: "auto", opacity: 1 }}
                exit={
                  isAnimEnabled
                    ? { height: 0, opacity: 0 }
                    : { height: 0, opacity: 0 }
                }
                transition={
                  isAnimEnabled
                    ? {
                        type: "spring",
                        stiffness: Math.round(320 * effectiveSpeed),
                        damping: 30,
                      }
                    : { duration: 0 }
                }
                className="overflow-hidden"
              >
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-primary-border space-y-4">
                  {/* 1. 基础动态色源切换：Windows 系统色 vs 图片莫奈画廊 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>高级动态取色工作台</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        默认跟随 Windows 系统主题色；你也可以丢入多张喜爱的壁纸插画提取专属色板（永久保存）
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/90 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDynamicSource("windows")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          dynamicSource === "windows"
                            ? "bg-primary text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Windows 主题色</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (monetSavedImages.length > 0) {
                            setDynamicSource("image");
                          } else {
                            fileInputRef.current?.click();
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          dynamicSource === "image"
                            ? "bg-primary text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>图片取色 ({monetSavedImages.length})</span>
                      </button>

                      <TypewriterTooltip
                        text="重新从 Windows DWM 注册表实时读取当前系统强调色"
                        position="top"
                      >
                        <button
                          type="button"
                          onClick={handleRefreshWinColor}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-primary-soft transition-colors cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              isRefreshingWin ? "animate-spin text-primary" : ""
                            }`}
                          />
                        </button>
                      </TypewriterTooltip>
                    </div>
                  </div>

                  {/* 2. 多图片拖拽 & 莫奈色板画廊（支持持久化落盘） */}
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/bmp"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {/* 拖拽投放区 */}
                    <div
                      ref={dropzoneRef}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleDomDrop}
                      className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center gap-3 text-center ${
                        isDraggingOver
                          ? "border-primary bg-primary-soft scale-[1.01]"
                          : "border-slate-300/90 bg-white/80 hover:border-primary hover:bg-white"
                      }`}
                    >
                      <JellyIcon intensity="gentle">
                        <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary-border shrink-0">
                          {isExtractingMonet ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </div>
                      </JellyIcon>
                      <div className="text-left">
                        <div className="text-xs font-bold text-slate-800">
                          {isExtractingMonet
                            ? "正在运行莫奈 Celebi 聚类算法提取色票并持久化落盘..."
                            : isDraggingOver
                              ? "松开鼠标，立即用莫奈算法提取这张图的灵魂配色喵！"
                              : "拖拽一张或多张图片到这里，或点击选择本地壁纸 / 插画"}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          支持 PNG / JPG / WebP 批量导入 · 自动生成轻量缩略图持久化存储，重启客户端永久保留
                        </div>
                      </div>
                    </div>

                    {/* 已持久化保存的图片取色卡片列表 */}
                    {monetSavedImages.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {monetSavedImages.map((img) => {
                          const isCardActive =
                            dynamicSource === "image" &&
                            (activeMonetImageId === img.id ||
                              (!activeMonetImageId &&
                                monetSavedImages[0]?.id === img.id));

                          return (
                            <div
                              key={img.id}
                              onClick={() =>
                                selectMonetImageSwatch(img.id, img.selected_hex)
                              }
                              className={`group/card relative p-2.5 rounded-xl bg-white border transition-all cursor-pointer flex items-center gap-3 ${
                                isCardActive
                                  ? "border-primary shadow-xs ring-1 ring-primary/40"
                                  : "border-slate-200/80 hover:border-slate-300"
                              }`}
                            >
                              {/* 左侧持久化缩略图 */}
                              <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200/70 relative">
                                <MonetThumbnail
                                  imagePath={img.image_path}
                                  alt={img.name}
                                />
                              </div>

                              {/* 右侧文件名与 6 枚莫奈推荐色票 */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className="text-xs font-bold text-slate-800 truncate"
                                    title={img.name}
                                  >
                                    {img.name}
                                  </span>
                                  <button
                                    type="button"
                                    title="移除此图片并清理缓存文件"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeMonetImage(img.id);
                                    }}
                                    className="opacity-0 group-hover/card:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* 莫奈色票圆点阵列 */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {img.palette.map((hex) => {
                                    const isSwatchSelected =
                                      isCardActive &&
                                      img.selected_hex.toLowerCase() ===
                                        hex.toLowerCase();
                                    return (
                                      <button
                                        key={hex}
                                        type="button"
                                        title={`应用莫奈色票 ${hex}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectMonetImageSwatch(img.id, hex);
                                        }}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer hover:scale-110 active:scale-95 border ${
                                          isSwatchSelected
                                            ? "scale-110 border-white ring-2 ring-slate-800/80 shadow-xs"
                                            : "border-black/10"
                                        }`}
                                        style={{ backgroundColor: hex }}
                                      >
                                        {isSwatchSelected && (
                                          <Check className="w-3 h-3 text-white drop-shadow-xs stroke-[3]" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. 高级选项底部终极联动开关：「游戏取色」 */}
                  <div className="pt-3 border-t border-slate-200/80">
                    <div
                      onClick={() => setGameAdaptiveAccent(!gameAdaptiveAccent)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        gameAdaptiveAccent
                          ? "bg-white border-primary shadow-xs"
                          : "bg-white/70 border-slate-200/80 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <JellyIcon intensity="bouncy">
                          <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary border border-primary-border flex items-center justify-center shrink-0">
                            <Gamepad2 className="w-4 h-4" />
                          </div>
                        </JellyIcon>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-slate-900">
                              游戏取色 (Game Adaptive Monet)
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-primary-text border border-primary-border">
                              选中即变色 · 防审美疲劳
                            </span>
                            {gameAdaptiveAccent && ephemeralGameAccent && (
                              <span className="text-[10px] font-mono text-slate-500 truncate">
                                当前跟随: {ephemeralGameAccent.trainerName} (
                                {ephemeralGameAccent.hex})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            开启后，在「启动」页点击切换不同修改器时，实时提取该游戏封面原画的莫奈主题色并丝滑过渡换肤喵~
                          </p>
                        </div>
                      </div>

                      {/* 滑块开关 */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={gameAdaptiveAccent}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGameAdaptiveAccent(!gameAdaptiveAccent);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          gameAdaptiveAccent ? "bg-primary" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            gameAdaptiveAccent ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 自定义颜色拾色器输入栏 */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pipette className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-700">
              想要精确指定固定色号？支持手动自定义 Hex
            </span>
          </div>

          <form onSubmit={handleHexSubmit} className="flex items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="color"
                value={normalizeHex(hexInput) || "#06b6d4"}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  setCustomHex(e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shadow-2xs overflow-hidden p-0 bg-transparent"
                title="打开系统调色盘精选颜色"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="#3b82f6"
                className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-800"
                style={{
                  borderColor: isCustom ? currentAccent.primary : undefined,
                }}
              />
            </div>

            <button
              type="submit"
              className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95"
              style={{
                backgroundColor: currentAccent.primary,
              }}
            >
              应用色号
            </button>
          </form>
        </div>
      </PaperCard>

      {/* 卡片 2：个性化即时效果预览沙盒 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: currentAccent.primary }} />
            <h3 className="text-sm font-bold text-slate-900">
              强调色即时交互沙盒 (Live Sandbox)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            切换上方颜色或莫奈色票，下方控件光速响应换装
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* 样例 1：主力操作按键 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                主力操作按钮高亮
              </span>
              <div>
                <button
                  className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                  style={{
                    background: currentAccent.gradient,
                    boxShadow: `0 4px 12px ${currentAccent.glow}`,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>一键下载并安装修改器</span>
                </button>
              </div>
            </div>

            {/* 样例 2：胶囊属性徽章群 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                微拟物徽章与状态
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                  style={{
                    backgroundColor: currentAccent.soft,
                    color: currentAccent.text,
                    border: `1px solid ${currentAccent.border}`,
                  }}
                >
                  <Layers className="w-3.5 h-3.5" />
                  修改器 v1.4.0
                </span>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: currentAccent.soft,
                    color: currentAccent.text,
                    border: `1px solid ${currentAccent.border}`,
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  已就绪
                </span>
              </div>
            </div>

            {/* 样例 3：果冻弹性回弹图标 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                果冻图标与发光
              </span>
              <div className="flex items-center gap-3">
                <JellyIcon intensity="bouncy">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-transform shadow-xs"
                    style={{
                      backgroundColor: currentAccent.soft,
                      border: `1px solid ${currentAccent.border}`,
                      color: currentAccent.primary,
                    }}
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                </JellyIcon>
                <div className="text-xs">
                  <span className="font-semibold text-slate-700 block">
                    鼠标悬停感受弹力
                  </span>
                  <span className="text-[10px] text-slate-400">
                    支持 3 级物理挤压
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 样例 4：流体滑块微控件联动 */}
          <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">
                流体滑块发光与填充跟随联动
              </span>
              <span
                className="font-mono font-bold"
                style={{ color: currentAccent.primary }}
              >
                {previewSliderVal}%
              </span>
            </div>
            <FluidSlider
              value={previewSliderVal}
              min={0}
              max={100}
              step={1}
              onChange={setPreviewSliderVal}
              formatValue={(v) => `${v}%`}
            />
          </div>
        </div>
      </PaperCard>

      {/* 卡片 3：个性化进阶规划路线 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>个性化皮肤未来蓝图</span>
          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
            后续规划
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* 明暗模式 */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3 opacity-80">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 border border-amber-200/60">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">深浅外观模式切换</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-mono">
                  即将推出
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                支持浅色模式（默认）、纯净暗夜深色模式与跟随 Windows 系统外观自动切换。
              </p>
            </div>
          </div>

          {/* 自定义全局背景壁纸与毛玻璃 */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3 opacity-80">
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 shrink-0 border border-cyan-200/60">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  全局背景壁纸铺底与毛玻璃 (Mica)
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-mono">
                  规划中
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                支持将画廊壁纸直接铺设为主界面半透明底图，并调节磨砂毛玻璃虚化模糊深度。
              </p>
            </div>
          </div>
        </div>
      </PaperCard>
    </PaperContainer>
  );
};
