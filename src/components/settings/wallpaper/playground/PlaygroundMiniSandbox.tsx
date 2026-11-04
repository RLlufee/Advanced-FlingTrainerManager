import React from "react";
import { Eye, AppWindow, PanelLeft, Layout, CreditCard, Check } from "lucide-react";
import { WallpaperLayersConfig, WallpaperSavedImage } from "../../../../services/configApi";

interface PlaygroundMiniSandboxProps {
  activeWallpaper: WallpaperSavedImage | null;
  wallpaperLayers: WallpaperLayersConfig;
  activeHoverLayer: string | null;
  onToggleLayer: (layerKey: keyof WallpaperLayersConfig) => void;
  onHoverLayer: (layerKey: string | null) => void;
}

export const PlaygroundMiniSandbox: React.FC<PlaygroundMiniSandboxProps> = ({
  activeWallpaper,
  wallpaperLayers,
  activeHoverLayer,
  onToggleLayer,
  onHoverLayer,
}) => {
  return (
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
          onClick={() => onToggleLayer("titlebar")}
          onMouseEnter={() => onHoverLayer("titlebar")}
          onMouseLeave={() => onHoverLayer(null)}
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
            onClick={() => onToggleLayer("sidebar")}
            onMouseEnter={() => onHoverLayer("sidebar")}
            onMouseLeave={() => onHoverLayer(null)}
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
            onClick={() => onToggleLayer("content")}
            onMouseEnter={() => onHoverLayer("content")}
            onMouseLeave={() => onHoverLayer(null)}
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
                  onToggleLayer("cards");
                }}
                onMouseEnter={() => onHoverLayer("cards")}
                onMouseLeave={() => onHoverLayer(null)}
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
                  onToggleLayer("cards");
                }}
                onMouseEnter={() => onHoverLayer("cards")}
                onMouseLeave={() => onHoverLayer(null)}
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
  );
};
