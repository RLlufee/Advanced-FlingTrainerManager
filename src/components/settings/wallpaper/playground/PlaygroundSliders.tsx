import React from "react";
import { FluidSlider } from "../../../ui/motion/FluidSlider";

interface PlaygroundSlidersProps {
  backdropBlur: number;
  surfaceTransparency: number;
  wallpaperOpacity: number;
  onChangeBackdropBlur: (val: number) => void;
  onChangeSurfaceTransparency: (val: number) => void;
  onChangeWallpaperOpacity: (val: number) => void;
}

export const PlaygroundSliders: React.FC<PlaygroundSlidersProps> = ({
  backdropBlur,
  surfaceTransparency,
  wallpaperOpacity,
  onChangeBackdropBlur,
  onChangeSurfaceTransparency,
  onChangeWallpaperOpacity,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-slate-700 dark:text-slate-200">全域磨砂模糊 (Blur)</span>
          <span className="font-mono text-slate-400">{backdropBlur} px</span>
        </div>
        <FluidSlider
          value={backdropBlur}
          min={0}
          max={24}
          onChange={onChangeBackdropBlur}
          formatValue={(val) => `${val} px`}
          ariaLabel="毛玻璃磨砂模糊强度"
        />
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="font-semibold text-slate-700 dark:text-slate-200">界面整体透光深度</span>
          <span className="font-mono text-slate-400">{surfaceTransparency}%</span>
        </div>
        <FluidSlider
          value={surfaceTransparency}
          min={0}
          max={50}
          onChange={onChangeSurfaceTransparency}
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
          onChange={onChangeWallpaperOpacity}
          formatValue={(val) => `${val}%`}
          ariaLabel="壁纸显现度"
        />
      </div>
    </div>
  );
};
