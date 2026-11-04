import React from "react";
import { Layers, PanelLeft, Layout, CreditCard, AppWindow } from "lucide-react";
import { WallpaperLayersConfig } from "../../../../services/configApi";
import { AccentColorConfig } from "../../../ui/theme/themePresets";
import { FluidSlider } from "../../../ui/motion/FluidSlider";

interface PlaygroundLayerTogglesProps {
  wallpaperLayers: WallpaperLayersConfig;
  currentAccent: AccentColorConfig;
  onToggleLayer: (layerKey: keyof WallpaperLayersConfig) => void;
  onSetWallpaperLayers: (patch: Partial<WallpaperLayersConfig>) => Promise<void>;
}

export const PlaygroundLayerToggles: React.FC<PlaygroundLayerTogglesProps> = ({
  wallpaperLayers,
  currentAccent,
  onToggleLayer,
  onSetWallpaperLayers,
}) => {
  return (
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

            <button
              type="button"
              role="switch"
              aria-checked={wallpaperLayers.sidebar}
              aria-label="侧边栏图层壁纸覆盖开关"
              onClick={() => onToggleLayer("sidebar")}
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
                onChange={(val) => void onSetWallpaperLayers({ sidebar_opacity: val })}
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

            <button
              type="button"
              role="switch"
              aria-checked={wallpaperLayers.content}
              aria-label="主工作区底板壁纸覆盖开关"
              onClick={() => onToggleLayer("content")}
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

            <button
              type="button"
              role="switch"
              aria-checked={wallpaperLayers.cards}
              aria-label="卡片图层壁纸覆盖开关"
              onClick={() => onToggleLayer("cards")}
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
                onChange={(val) => void onSetWallpaperLayers({ card_opacity: val })}
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

            <button
              type="button"
              role="switch"
              aria-checked={wallpaperLayers.titlebar}
              aria-label="顶部标题栏壁纸覆盖开关"
              onClick={() => onToggleLayer("titlebar")}
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
  );
};
