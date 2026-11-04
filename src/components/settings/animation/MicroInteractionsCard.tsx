import React from "react";
import { Sliders } from "lucide-react";
import { useAnimationConfig } from "../../ui/motion/AnimationContext";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { JellyIntensity } from "../../../services/configApi";

export const MicroInteractionsCard: React.FC = () => {
  const { settings, updateSettings } = useAnimationConfig();

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4 transition-colors">
      <div className="flex items-start gap-3.5">
        <JellyIcon intensity="gentle">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
            <Sliders className="w-5 h-5" />
          </div>
        </JellyIcon>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            微交互维度定制开关
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            随心组合不同的物理动效模块，定制专属的手感偏好。
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
        {/* 1. 3D 纸片飘落 */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              3D 纸片悬浮飘落入场 (Paper Flutter)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              切换标签页或打开修改器时，模块卡片带有轻微倾角与层次交错瀑布流落入位置
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ paper_flutter: !settings.paper_flutter })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.paper_flutter ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                settings.paper_flutter ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 2. 磁吸跟手与滑行药丸 */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              磁吸光标跟手与流体滑动指示药丸 (Magnetic Pull)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              选项卡随鼠标微弱吸引拉伸，切换时背景深色药丸在按钮间无缝穿梭滑动
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ magnetic_tabs: !settings.magnetic_tabs })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.magnetic_tabs ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                settings.magnetic_tabs ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 3. 果冻形变强度选择 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              图标 Q 弹果冻弹性强度 (Jelly Morph Intensity)
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              鼠标经过图标与按钮时的物理弹性挤压幅度
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            {(["off", "gentle", "medium", "bouncy"] as JellyIntensity[]).map((level) => {
              const labelMap: Record<JellyIntensity, string> = {
                off: "关闭",
                gentle: "柔和",
                medium: "适中",
                bouncy: "Q 弹",
              };
              const isSelected = settings.jelly_intensity === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateSettings({ jelly_intensity: level })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {labelMap[level]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PaperCard>
  );
};
