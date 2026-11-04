import React from "react";
import { Sparkles, Heart, Zap, RotateCcw } from "lucide-react";
import { useAnimationConfig } from "../../ui/motion/AnimationContext";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../../ui/motion/TypewriterTooltip";

interface AnimationPresetCardsProps {
  onPresetApplied?: () => void;
}

export const AnimationPresetCards: React.FC<AnimationPresetCardsProps> = ({
  onPresetApplied,
}) => {
  const { settings, updateSettings } = useAnimationConfig();

  // 4 大一键风格预设
  const applyPreset = async (preset: "esports" | "balanced" | "pudding" | "static") => {
    switch (preset) {
      case "esports":
        await updateSettings({
          enabled: true,
          speed_multiplier: 30, // 瞬间完成
          jelly_intensity: "off",
          paper_flutter: false,
          magnetic_tabs: false,
          typewriter_speed: 0,
          tab_transition_duration: 0,
        });
        break;
      case "balanced":
        await updateSettings({
          enabled: true,
          speed_multiplier: 1.0,
          jelly_intensity: "medium",
          paper_flutter: true,
          magnetic_tabs: true,
          typewriter_speed: 18,
          tab_transition_duration: 180,
        });
        break;
      case "pudding":
        await updateSettings({
          enabled: true,
          speed_multiplier: 0.85,
          jelly_intensity: "bouncy",
          paper_flutter: true,
          magnetic_tabs: true,
          typewriter_speed: 14,
          tab_transition_duration: 220,
        });
        break;
      case "static":
        await updateSettings({
          enabled: false,
          speed_multiplier: 1.0,
          jelly_intensity: "off",
          paper_flutter: false,
          magnetic_tabs: false,
          typewriter_speed: 0,
          tab_transition_duration: 0,
        });
        break;
    }
    onPresetApplied?.();
  };

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="bouncy">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                界面动效总控与 PCL-CE 风格预设
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400">
                Motion 14 驱动
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              借鉴 Plain Craft Launcher 2 的动效速度与性能调度哲学，支持毫秒级无级调节全站动画倍率，亦可一键瞬间切换或彻底关闭。
            </p>
          </div>
        </div>

        {/* 全局动效总开关 */}
        <TypewriterTooltip text="开启或关闭全站所有微交互动效" position="left">
          <button
            type="button"
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.enabled ? "bg-cyan-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </TypewriterTooltip>
      </div>

      {/* 4 大风格一键预设矩阵 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2.5">
          一键风格预设档位 (点击即时切换)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. 优雅微拟物 */}
          <div
            onClick={() => applyPreset("balanced")}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
              settings.enabled &&
              settings.speed_multiplier === 1.0 &&
              settings.jelly_intensity === "medium" &&
              (settings.tab_transition_duration ?? 180) === 180
                ? "bg-cyan-50/50 dark:bg-cyan-950/40 border-cyan-400 dark:border-cyan-500 ring-1 ring-cyan-400/20 shadow-xs"
                : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <JellyIcon intensity="gentle">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </JellyIcon>
                优雅微拟物
              </span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">推荐</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-snug">
              1.0x 均衡流体质感，纸片与磁吸完整呈现
            </p>
          </div>

          {/* 2. Q 弹布丁 */}
          <div
            onClick={() => applyPreset("pudding")}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
              settings.enabled && settings.jelly_intensity === "bouncy"
                ? "bg-amber-50/50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500 ring-1 ring-amber-400/20 shadow-xs"
                : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <JellyIcon intensity="bouncy">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                </JellyIcon>
                Q 弹布丁
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">超解压</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-snug">
              夸张的果冻弹性回弹与活泼的物理形变
            </p>
          </div>

          {/* 3. 极速电竞 */}
          <div
            onClick={() => applyPreset("esports")}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
              settings.enabled &&
              (settings.speed_multiplier >= 30 || (settings.tab_transition_duration ?? 180) === 0)
                ? "bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-400/20 shadow-xs"
                : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <JellyIcon intensity="gentle">
                  <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600" />
                </JellyIcon>
                极速电竞
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">0ms 瞬切</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-snug">
              无任何等待过渡，高刷新率极客首选
            </p>
          </div>

          {/* 4. 纯净静止 */}
          <div
            onClick={() => applyPreset("static")}
            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
              !settings.enabled
                ? "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-1 ring-slate-400/20 shadow-xs"
                : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                纯净静止
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">性能</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-snug">
              彻底停用动效，极致精简与低功耗
            </p>
          </div>
        </div>
      </div>
    </PaperCard>
  );
};
