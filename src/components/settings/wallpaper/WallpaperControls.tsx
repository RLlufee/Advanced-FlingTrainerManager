import React from "react";
import { FlaskConical, Sparkles } from "lucide-react";
import { WallpaperFit } from "../../../services/configApi";
import { FluidSlider } from "../../ui/motion/FluidSlider";
import { JellyIcon } from "../../ui/motion/JellyIcon";

interface WallpaperControlsProps {
  wallpaperOpacity: number;
  wallpaperBlur: number;
  wallpaperFit: WallpaperFit;
  isPlaygroundOpen: boolean;
  onSetWallpaperOpacity: (value: number) => Promise<void>;
  onSetWallpaperBlur: (value: number) => Promise<void>;
  onSetWallpaperFit: (fit: WallpaperFit) => Promise<void>;
  onTogglePlayground: () => void;
}

export const WallpaperControls: React.FC<WallpaperControlsProps> = ({
  wallpaperOpacity,
  wallpaperBlur,
  wallpaperFit,
  isPlaygroundOpen,
  onSetWallpaperOpacity,
  onSetWallpaperBlur,
  onSetWallpaperFit,
  onTogglePlayground,
}) => {
  return (
    <div className="space-y-4">
      {/* 基础参数调节面板 */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-700/70 dark:bg-slate-900/40 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                壁纸显现度 (Opacity)
              </span>
              <span className="font-mono text-slate-500">{wallpaperOpacity}%</span>
            </div>
            <FluidSlider
              value={wallpaperOpacity}
              min={0}
              max={100}
              onChange={(value) => void onSetWallpaperOpacity(value)}
              formatValue={(value) => `${value}%`}
              ariaLabel="壁纸显现度"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                原图模糊强度 (Blur)
              </span>
              <span className="font-mono text-slate-500">{wallpaperBlur} px</span>
            </div>
            <FluidSlider
              value={wallpaperBlur}
              min={0}
              max={20}
              onChange={(value) => void onSetWallpaperBlur(value)}
              formatValue={(value) => `${value} px`}
              ariaLabel="壁纸模糊强度"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              图片适应填充方式
            </span>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["cover", "填充裁切 (推荐)"],
                ["contain", "完整适应 (保持比例)"],
              ] as const).map(([fit, label]) => (
                <button
                  key={fit}
                  type="button"
                  aria-pressed={wallpaperFit === fit}
                  onClick={() => void onSetWallpaperFit(fit)}
                  className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors cursor-pointer ${
                    wallpaperFit === fit
                      ? "border-primary bg-primary-soft text-primary shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed pt-1">
            提示：更细腻的分图层穿透与各图层独立透明度，可通过下方的「图层覆盖游乐场」深度调校~
          </div>
        </div>
      </div>

      {/* 进入游乐场（Playground）抽屉入口卡片 */}
      <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-r from-primary-soft/40 via-white to-primary-soft/30 dark:from-primary-soft/10 dark:via-slate-900/60 dark:to-primary-soft/10 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <JellyIcon intensity="bouncy">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
                <FlaskConical className="w-3.5 h-3.5" />
              </span>
            </JellyIcon>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>壁纸图层覆盖调试游乐场</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                自由定制图层
              </span>
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            选好壁纸后，在此调试哪些界面图层（侧边栏、主工作区、卡片、顶部标题栏）被壁纸渗透与覆盖
          </p>
        </div>

        <button
          type="button"
          onClick={onTogglePlayground}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary hover:opacity-90 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isPlaygroundOpen ? "收起游乐场" : "启动图层游乐场"}</span>
        </button>
      </div>
    </div>
  );
};
