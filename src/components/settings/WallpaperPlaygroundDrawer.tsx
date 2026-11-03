/**
 * @file WallpaperPlaygroundDrawer.tsx
 * @description 自定义壁纸 - 图层覆盖调试游乐场（Wallpaper Layer Playground）
 * 允许用户可视化选择并调试哪些界面图层（顶栏、侧栏、主工作区底板、纸张卡片、浮层弹窗）被壁纸穿透与覆盖。
 */

import React, { useState } from "react";
import {
  Layers,
  Sparkles,
  PanelLeft,
  Layout,
  CreditCard,
  AppWindow,
  RotateCcw,
  Check,
  ChevronLeft,
  Eye,
  Wand2,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../ui/theme";
import { useAnimationConfig } from "../ui/motion/AnimationContext";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { FluidSlider } from "../ui/motion/FluidSlider";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import type { WallpaperLayersConfig } from "../../services/configApi";

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
          <TypewriterTooltip content="将所有图层覆盖状态恢复至官方推荐模式">
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

      {/* 模块 1：交互式 UI 结构微缩沙盒 (Visual Interactive Mini-Sandbox) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-900/60 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>界面图层拓扑沙盒（点击下方区域可直接切换覆盖）</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            高亮代表壁纸已穿透覆盖，实色代表原生纯底
          </span>
        </div>

        {/* 仿桌面启动器微缩沙盒结构 */}
        <div className="relative h-44 w-full rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col bg-slate-200 dark:bg-slate-950 shadow-inner select-none">
          {/* 背景壁纸底层暗示 */}
          {activeWallpaper && (
            <div
              className="absolute inset-0 opacity-40 blur-xs bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: `url(${activeWallpaper.image_path})`,
              }}
            />
          )}

          {/* 1. 顶栏微缩图层 (TitleBar) */}
          <div
            onClick={() => toggleLayer("titlebar")}
            onMouseEnter={() => setActiveHoverLayer("titlebar")}
            onMouseLeave={() => setActiveHoverLayer(null)}
            className={`relative z-10 h-7 px-3 flex items-center justify-between border-b transition-all cursor-pointer ${
              wallpaperLayers.titlebar
                ? "bg-primary/40 backdrop-blur-md border-primary text-white"
                : "bg-slate-800 dark:bg-slate-900 border-slate-700 text-slate-300"
            } ${activeHoverLayer === "titlebar" ? "ring-2 ring-primary" : ""}`}
            title="点击切换：顶部标题栏图层覆盖"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
              <AppWindow className="w-3 h-3" />
              <span>顶部标题栏图层 (TitleBar)</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-black/20">
              {wallpaperLayers.titlebar ? "已全屏穿透" : "避开铺设"}
            </div>
          </div>

          {/* 下半部：侧栏与主工作区 */}
          <div className="relative z-10 flex-1 flex overflow-hidden">
            {/* 2. 侧边栏微缩图层 (Sidebar) */}
            <div
              onClick={() => toggleLayer("sidebar")}
              onMouseEnter={() => setActiveHoverLayer("sidebar")}
              onMouseLeave={() => setActiveHoverLayer(null)}
              className={`w-36 border-r p-2 flex flex-col justify-between transition-all cursor-pointer ${
                wallpaperLayers.sidebar
                  ? "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-primary"
                  : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800"
              } ${activeHoverLayer === "sidebar" ? "ring-2 ring-primary" : ""}`}
              title="点击切换：侧边栏导航图层覆盖"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                  <PanelLeft className="w-3 h-3 text-primary" />
                  <span>侧边栏图层</span>
                </div>
                <div className="h-1.5 w-16 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="h-1.5 w-20 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-medium">
                {wallpaperLayers.sidebar ? "✓ 壁纸渗透" : "实色底板"}
              </span>
            </div>

            {/* 3. 主工作区底板 (Content Area) */}
            <div
              onClick={() => toggleLayer("content")}
              onMouseEnter={() => setActiveHoverLayer("content")}
              onMouseLeave={() => setActiveHoverLayer(null)}
              className={`flex-1 p-2.5 flex flex-col gap-2 transition-all cursor-pointer ${
                wallpaperLayers.content
                  ? "bg-transparent border-dashed border-2 border-primary/50"
                  : "bg-slate-100 dark:bg-[#131c31] border border-transparent"
              } ${activeHoverLayer === "content" ? "ring-2 ring-primary" : ""}`}
              title="点击切换：主工作区底衬覆盖"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  <Layout className="w-3 h-3 text-primary" />
                  <span>主工作区底板图层</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {wallpaperLayers.content ? "✓ 底图大面积透出" : "实底衬板"}
                </span>
              </div>

              {/* 4. 浮动卡片微缩图层 (Cards) */}
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayer("cards");
                  }}
                  onMouseEnter={() => setActiveHoverLayer("cards")}
                  onMouseLeave={() => setActiveHoverLayer(null)}
                  className={`h-16 rounded-lg p-1.5 border flex flex-col justify-between transition-all cursor-pointer ${
                    wallpaperLayers.cards
                      ? "bg-white/50 dark:bg-[#131c31]/60 backdrop-blur-md border-primary ring-1 ring-primary/40 text-primary"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  } ${activeHoverLayer === "cards" ? "ring-2 ring-primary" : ""}`}
                  title="点击切换：纸张卡片容器图层覆盖"
                >
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-2.5 h-2.5" /> 卡片图层 A
                    </span>
                    {wallpaperLayers.cards && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="text-[8px] text-slate-400">
                    {wallpaperLayers.cards ? "磨砂玻璃拟态" : "实体白色/深蓝卡片"}
                  </span>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayer("cards");
                  }}
                  onMouseEnter={() => setActiveHoverLayer("cards")}
                  onMouseLeave={() => setActiveHoverLayer(null)}
                  className={`h-16 rounded-lg p-1.5 border flex flex-col justify-between transition-all cursor-pointer ${
                    wallpaperLayers.cards
                      ? "bg-white/50 dark:bg-[#131c31]/60 backdrop-blur-md border-primary ring-1 ring-primary/40 text-primary"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  } ${activeHoverLayer === "cards" ? "ring-2 ring-primary" : ""}`}
                  title="点击切换：纸张卡片容器图层覆盖"
                >
                  <div className="flex items-center justify-between text-[9px] font-bold">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-2.5 h-2.5" /> 卡片图层 B
                    </span>
                    {wallpaperLayers.cards && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="text-[8px] text-slate-400">
                    {wallpaperLayers.cards ? "壁纸若隐若现" : "实体不透明"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 模块 2：各图层覆盖开关矩阵 (Layer Switch Matrix) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>独立图层覆盖控制清单</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            按需选择开启覆盖的图层，未被覆盖的图层将保留纯净实色
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* ① 侧边栏导航层 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              wallpaperLayers.sidebar
                ? "border-primary/60 bg-primary-soft/30 dark:bg-primary-soft/10"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: wallpaperLayers.sidebar ? currentAccent.primary : undefined,
                    color: wallpaperLayers.sidebar ? "#ffffff" : undefined,
                  }}
                >
                  <PanelLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    导航侧边栏图层 (Sidebar)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    覆盖启动页、设置页、下载页与更多页的左侧侧边栏，呈现半透明毛玻璃质感
                  </p>
                </div>
              </div>

              {/* 标准 Switch 开关 */}
              <button
                type="button"
                role="switch"
                aria-checked={wallpaperLayers.sidebar}
                aria-label="侧边栏图层壁纸覆盖开关"
                onClick={() => toggleLayer("sidebar")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  wallpaperLayers.sidebar ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    wallpaperLayers.sidebar ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {wallpaperLayers.sidebar && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">侧栏不透明度</span>
                  <span className="font-mono text-slate-400">{wallpaperLayers.sidebar_opacity ?? 75}%</span>
                </div>
                <FluidSlider
                  value={wallpaperLayers.sidebar_opacity ?? 75}
                  min={30}
                  max={95}
                  onChange={(val) => void setWallpaperLayers({ sidebar_opacity: val })}
                  formatValue={(val) => `${val}%`}
                  ariaLabel="侧栏不透明度"
                />
              </div>
            )}
          </div>

          {/* ② 主工作区底板层 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              wallpaperLayers.content
                ? "border-primary/60 bg-primary-soft/30 dark:bg-primary-soft/10"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: wallpaperLayers.content ? currentAccent.primary : undefined,
                    color: wallpaperLayers.content ? "#ffffff" : undefined,
                  }}
                >
                  <Layout className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    主工作区底衬图层 (Content Area)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    覆盖右侧主力内容滚动区域的背景底板，使壁纸大面积展露
                  </p>
                </div>
              </div>

              {/* 标准 Switch 开关 */}
              <button
                type="button"
                role="switch"
                aria-checked={wallpaperLayers.content}
                aria-label="主工作区底板壁纸覆盖开关"
                onClick={() => toggleLayer("content")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  wallpaperLayers.content ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    wallpaperLayers.content ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ③ 内容纸张卡片层 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              wallpaperLayers.cards
                ? "border-primary/60 bg-primary-soft/30 dark:bg-primary-soft/10"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: wallpaperLayers.cards ? currentAccent.primary : undefined,
                    color: wallpaperLayers.cards ? "#ffffff" : undefined,
                  }}
                >
                  <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    纸张卡片容器图层 (Paper Cards)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    使各页面内的功能纸片卡片转换为半透明玻璃拟态，壁纸能隐约穿透卡片
                  </p>
                </div>
              </div>

              {/* 标准 Switch 开关 */}
              <button
                type="button"
                role="switch"
                aria-checked={wallpaperLayers.cards}
                aria-label="卡片图层壁纸覆盖开关"
                onClick={() => toggleLayer("cards")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  wallpaperLayers.cards ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    wallpaperLayers.cards ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {wallpaperLayers.cards && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">卡片不透明度</span>
                  <span className="font-mono text-slate-400">{wallpaperLayers.card_opacity ?? 80}%</span>
                </div>
                <FluidSlider
                  value={wallpaperLayers.card_opacity ?? 80}
                  min={35}
                  max={95}
                  onChange={(val) => void setWallpaperLayers({ card_opacity: val })}
                  formatValue={(val) => `${val}%`}
                  ariaLabel="卡片不透明度"
                />
              </div>
            )}
          </div>

          {/* ④ 顶部标题栏图层 */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              wallpaperLayers.titlebar
                ? "border-primary/60 bg-primary-soft/30 dark:bg-primary-soft/10"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: wallpaperLayers.titlebar ? currentAccent.primary : undefined,
                    color: wallpaperLayers.titlebar ? "#ffffff" : undefined,
                  }}
                >
                  <AppWindow className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    顶部标题栏图层 (TitleBar)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    壁纸全屏铺设至窗口顶端（top-0），标题栏底色转为轻量毛玻璃沉浸融合
                  </p>
                </div>
              </div>

              {/* 标准 Switch 开关 */}
              <button
                type="button"
                role="switch"
                aria-checked={wallpaperLayers.titlebar}
                aria-label="顶部标题栏壁纸覆盖开关"
                onClick={() => toggleLayer("titlebar")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  wallpaperLayers.titlebar ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    wallpaperLayers.titlebar ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 模块 3：微调实验室与毛玻璃滤镜 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">全域磨砂模糊 (Blur)</span>
            <span className="font-mono text-slate-400">{wallpaperLayers.backdrop_blur ?? 12} px</span>
          </div>
          <FluidSlider
            value={wallpaperLayers.backdrop_blur ?? 12}
            min={0}
            max={24}
            onChange={(val) => void setWallpaperLayers({ backdrop_blur: val })}
            formatValue={(val) => `${val} px`}
            ariaLabel="毛玻璃磨砂模糊强度"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">界面整体透光深度</span>
            <span className="font-mono text-slate-400">{wallpaperSurfaceTransparency}%</span>
          </div>
          <FluidSlider
            value={wallpaperSurfaceTransparency}
            min={0}
            max={50}
            onChange={(val) => void setWallpaperSurfaceTransparency(val)}
            formatValue={(val) => `${val}%`}
            ariaLabel="界面透光度"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">壁纸原图显现度</span>
            <span className="font-mono text-slate-400">{wallpaperOpacity}%</span>
          </div>
          <FluidSlider
            value={wallpaperOpacity}
            min={10}
            max={100}
            onChange={(val) => void setWallpaperOpacity(val)}
            formatValue={(val) => `${val}%`}
            ariaLabel="壁纸显现度"
          />
        </div>
      </div>

      {/* 模块 4：游乐场灵感预设一键套用 */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            游乐场灵感预设：
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset("immersive")}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-primary/40 bg-white dark:bg-slate-800 hover:bg-primary-soft text-primary transition-colors cursor-pointer"
          >
            🌟 全域极光沉浸
          </button>
          <button
            type="button"
            onClick={() => applyPreset("classic")}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            📐 经典侧栏透视
          </button>
          <button
            type="button"
            onClick={() => applyPreset("floating")}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            🃏 纯净卡片悬浮
          </button>
          <button
            type="button"
            onClick={() => applyPreset("minimal")}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            🧼 极简底衬渗透
          </button>
        </div>
      </div>
    </motion.div>
  );
};
