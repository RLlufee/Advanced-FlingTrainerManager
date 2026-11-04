/**
 * @file WallpaperPlaygroundDrawer.tsx
 * @description 自定义壁纸 - 图层覆盖调试游乐场（Wallpaper Layer Playground）
 * 允许用户可视化选择并调试哪些界面图层（顶栏、侧栏、主工作区底板、纸张卡片、浮层弹窗）被壁纸穿透与覆盖。
 */

import React, { useState } from "react";
import {
  Sparkles,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../ui/theme";
import { useAnimationConfig } from "../ui/motion/AnimationContext";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import type { WallpaperLayersConfig } from "../../services/configApi";
import {
  PlaygroundMiniSandbox,
  PlaygroundLayerToggles,
  PlaygroundSliders,
  PlaygroundPresets,
} from "./wallpaper/playground";

interface WallpaperPlaygroundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WallpaperPlaygroundDrawer: React.FC<WallpaperPlaygroundDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeWallpaper,
    wallpaperOpacity,
    wallpaperSurfaceTransparency,
    wallpaperLayers,
    currentAccent,
    setWallpaperOpacity,
    setWallpaperSurfaceTransparency,
    setWallpaperLayers,
    resetWallpaperLayers,
  } = useTheme();

  const { effectiveSpeed } = useAnimationConfig();
  const [activeHoverLayer, setActiveHoverLayer] = useState<string | null>(null);

  if (!isOpen) return null;

  // 快捷图层切换辅助
  const toggleLayer = (layerKey: keyof WallpaperLayersConfig) => {
    const current = Boolean(wallpaperLayers[layerKey]);
    void setWallpaperLayers({ [layerKey]: !current });
  };

  // 预设配置方案
  const applyPreset = (presetName: "immersive" | "classic" | "floating" | "minimal") => {
    switch (presetName) {
      case "immersive":
        void setWallpaperLayers({
          sidebar: true,
          content: true,
          cards: true,
          titlebar: true,
          modals: true,
          card_opacity: 75,
          sidebar_opacity: 70,
          backdrop_blur: 16,
        });
        void setWallpaperSurfaceTransparency(30);
        break;
      case "classic":
        void setWallpaperLayers({
          sidebar: true,
          content: false,
          cards: false,
          titlebar: false,
          modals: false,
          sidebar_opacity: 80,
          backdrop_blur: 12,
        });
        void setWallpaperSurfaceTransparency(20);
        break;
      case "floating":
        void setWallpaperLayers({
          sidebar: true,
          content: true,
          cards: false,
          titlebar: false,
          modals: false,
          sidebar_opacity: 75,
          backdrop_blur: 10,
        });
        void setWallpaperSurfaceTransparency(25);
        break;
      case "minimal":
        void setWallpaperLayers({
          sidebar: false,
          content: true,
          cards: false,
          titlebar: false,
          modals: false,
          backdrop_blur: 8,
        });
        void setWallpaperSurfaceTransparency(15);
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: Math.round(300 * effectiveSpeed),
        damping: 26,
      }}
      className="rounded-2xl border-2 border-primary/40 bg-gradient-to-b from-white to-slate-50/90 dark:from-[#131c31] dark:to-[#0f172a] shadow-xl overflow-hidden p-5 space-y-5"
    >
      {/* 游乐场头部与导航 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="返回壁纸基础配置"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <JellyIcon intensity="bouncy">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </JellyIcon>
              <span>壁纸图层调试游乐场</span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: currentAccent.soft,
                  color: currentAccent.text,
                  border: `1px solid ${currentAccent.border}`,
                }}
              >
                Playground Mode · 0ms 即时生效
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              点击下方线框或开关，自由调试哪些 UI 图层被自定义壁纸穿透渗透，定制你的专属视觉层次
            </p>
          </div>
        </div>

        {/* 顶部操作区 */}
        <div className="flex items-center gap-2">
          <TypewriterTooltip text="将所有图层覆盖状态恢复至官方推荐模式">
            <button
              type="button"
              onClick={() => void resetWallpaperLayers()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置图层默认</span>
            </button>
          </TypewriterTooltip>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer active:scale-95"
          >
            <span>完成调试</span>
          </button>
        </div>
      </div>

      {/* 模块 1：交互式 UI 结构微缩沙盒 */}
      <PlaygroundMiniSandbox
        activeWallpaper={activeWallpaper}
        wallpaperLayers={wallpaperLayers}
        activeHoverLayer={activeHoverLayer}
        onToggleLayer={toggleLayer}
        onHoverLayer={setActiveHoverLayer}
      />

      {/* 模块 2：各图层覆盖开关矩阵 */}
      <PlaygroundLayerToggles
        wallpaperLayers={wallpaperLayers}
        currentAccent={currentAccent}
        onToggleLayer={toggleLayer}
        onSetWallpaperLayers={setWallpaperLayers}
      />

      {/* 模块 3：微调实验室与毛玻璃滤镜 */}
      <PlaygroundSliders
        backdropBlur={wallpaperLayers.backdrop_blur ?? 12}
        surfaceTransparency={wallpaperSurfaceTransparency}
        wallpaperOpacity={wallpaperOpacity}
        onChangeBackdropBlur={(val) => void setWallpaperLayers({ backdrop_blur: val })}
        onChangeSurfaceTransparency={(val) => void setWallpaperSurfaceTransparency(val)}
        onChangeWallpaperOpacity={(val) => void setWallpaperOpacity(val)}
      />

      {/* 模块 4：游乐场灵感预设一键套用 */}
      <PlaygroundPresets onApplyPreset={applyPreset} />
    </motion.div>
  );
};
