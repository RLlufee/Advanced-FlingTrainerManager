/**
 * @file MonetDynamicSection.tsx
 * @description 莫奈智能动态取色引擎（含 Google Material You 聚类色盘画廊与游戏取色）
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Check,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Monitor,
  Upload,
  Trash2,
  Gamepad2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useTheme } from "../../ui/theme";
import { useAnimationConfig } from "../../ui/motion/AnimationContext";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../../ui/motion/TypewriterTooltip";
import { MonetThumbnail } from "./MonetThumbnail";

const isPhysicalPointInside = (
  element: HTMLElement | null,
  position: { x: number; y: number }
) => {
  if (!element || element.offsetParent === null) return false;
  const rect = element.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const x = position.x / ratio;
  const y = position.y / ratio;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

export const MonetDynamicSection: React.FC = () => {
  const {
    currentAccent,
    isDynamic,
    dynamicSource,
    windowsAccentHex,
    monetSavedImages,
    activeMonetImageId,
    gameAdaptiveAccent,
    ephemeralGameAccent,
    isExtractingMonet,
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

  // 将 Tauri 原生拖放精确路由到当前指针所在的莫奈投放区，避免和壁纸库重复导入
  useEffect(() => {
    if (!isDynamic || advancedCollapsed) return;

    let unlisten: (() => void) | null = null;
    let disposed = false;

    const setupTauriDrop = async () => {
      try {
        const fn = await getCurrentWebview().onDragDropEvent(async (event) => {
          const payload = event.payload;
          if (payload.type === "leave") {
            setIsDraggingOver(false);
            return;
          }
          const isTargeted = isPhysicalPointInside(dropzoneRef.current, payload.position);
          setIsDraggingOver(isTargeted && payload.type !== "drop");
          if (payload.type === "drop") {
            setIsDraggingOver(false);
            if (isTargeted && payload.paths.length > 0) {
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
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                动态取色 (Google Monet / Material You)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
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
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {isDynamic
                ? `当前生效：${currentAccent.name} · 点击可折叠/展开下方高级莫奈选项`
                : "省心默认自动同步 Windows 系统主题色；选中后可展开「图片莫奈取色」与「启动页游戏取色」喵~"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isDynamic ? (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 group-hover:border-slate-300 shadow-2xs transition-all">
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
            <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-primary-border space-y-4">
              {/* 1. 基础动态色源切换：Windows 系统色 vs 图片莫奈画廊 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>高级动态取色工作台</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    默认跟随 Windows 系统主题色；你也可以丢入多张喜爱的壁纸插画提取专属色板（永久保存）
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200/90 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDynamicSource("windows")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      dynamicSource === "windows"
                        ? "bg-primary text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
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
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
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
                      : "border-slate-300/90 dark:border-slate-700 bg-white/80 dark:bg-slate-850 hover:border-primary hover:bg-white dark:hover:bg-slate-800"
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
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isExtractingMonet
                        ? "正在运行莫奈 Celebi 聚类算法提取色票并持久化落盘..."
                        : isDraggingOver
                          ? "松开鼠标，立即用莫奈算法提取这张图的灵魂配色喵！"
                          : "拖拽一张或多张图片到这里，或点击选择本地壁纸 / 插画"}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
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
                          className={`group/card relative p-2.5 rounded-xl bg-white dark:bg-slate-800 border transition-all cursor-pointer flex items-center gap-3 ${
                            isCardActive
                              ? "border-primary shadow-xs ring-1 ring-primary/40"
                              : "border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          {/* 左侧持久化缩略图 */}
                          <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200/70 dark:border-slate-700 relative">
                            <MonetThumbnail
                              imagePath={img.image_path}
                              alt={img.name}
                            />
                          </div>

                          {/* 右侧文件名与 6 枚莫奈推荐色票 */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
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
                                className="opacity-0 group-hover/card:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all cursor-pointer shrink-0"
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
                                        : "border-black/10 dark:border-white/20"
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
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <div
                  onClick={() => setGameAdaptiveAccent(!gameAdaptiveAccent)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    gameAdaptiveAccent
                      ? "bg-white dark:bg-slate-800 border-primary shadow-xs"
                      : "bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
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
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                          游戏取色 (Game Adaptive Monet)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-primary-text border border-primary-border">
                          选中即变色 · 防审美疲劳
                        </span>
                        {gameAdaptiveAccent && ephemeralGameAccent && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                            当前跟随: {ephemeralGameAccent.trainerName} (
                            {ephemeralGameAccent.hex})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        开启后，在「启动」页点击切换不同修改器时，实时提取该游戏封面原画的莫奈主题色并丝滑过渡换肤喵~
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={gameAdaptiveAccent}
                    onClick={(e) => {
                      e.stopPropagation();
                      setGameAdaptiveAccent(!gameAdaptiveAccent);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      gameAdaptiveAccent ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
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
  );
};
