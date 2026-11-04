import React from "react";
import { Gamepad2, RefreshCw, Heart, Zap, Layers } from "lucide-react";
import { useAnimationConfig } from "../../ui/motion/AnimationContext";
import { PaperContainer, PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../../ui/motion/TypewriterTooltip";

interface AnimationPlaygroundCardProps {
  playgroundKey: number;
  onRefreshPlayground: () => void;
}

export const AnimationPlaygroundCard: React.FC<AnimationPlaygroundCardProps> = ({
  playgroundKey,
  onRefreshPlayground,
}) => {
  const {
    settings,
    isAnimEnabled,
    effectiveSpeed,
    jellyIntensity,
  } = useAnimationConfig();

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <JellyIcon intensity="bouncy">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200/60 dark:border-cyan-800/80 shadow-2xs">
              <Gamepad2 className="w-4 h-4" />
            </div>
          </JellyIcon>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>实时交互调试游乐场</span>
              <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800 px-2 py-0.5 rounded-full font-medium">
                无需切页 · 晃动鼠标即时预览
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              调节上方滑块或预设后，可在此测试卡片直接感受真实的弹性与入场动效喵~
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshPlayground}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>重新飘落卡片</span>
        </button>
      </div>

      {/* 动态游乐场容器 */}
      <PaperContainer
        key={playgroundKey}
        staggerDelay={0.08}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
      >
        {/* 测试卡片 1 */}
        <PaperCard
          delayIndex={0}
          tiltAngle={2.5}
          className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/80 hover:border-cyan-400/60 dark:hover:border-cyan-500/60 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="bouncy">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/70 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform shadow-2xs">
                <Heart className="w-4 h-4 fill-cyan-500 text-cyan-600 dark:text-cyan-400" />
              </div>
            </JellyIcon>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700">
              测试卡片 #1
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              鼠标移入测试果冻形变
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              当前果冻档位: <strong className="font-mono text-slate-700 dark:text-slate-300">{jellyIntensity}</strong>
            </p>
          </div>
        </PaperCard>

        {/* 测试卡片 2 */}
        <PaperCard
          delayIndex={1}
          tiltAngle={2.5}
          className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/80 hover:border-amber-400/60 dark:hover:border-amber-500/60 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="bouncy">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-2xs">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-600 dark:text-amber-400" />
              </div>
            </JellyIcon>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700">
              测试卡片 #2
            </span>
          </div>
          <div>
            <TypewriterTooltip text="恭喜！打字机提示与纸片动效已全域完美联动喵~" position="top">
              <button
                type="button"
                className="w-full py-1.5 px-2 bg-amber-50/80 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-semibold text-amber-800 dark:text-amber-300 cursor-help transition-colors text-center"
              >
                悬浮测试打字机提示 ❯
              </button>
            </TypewriterTooltip>
          </div>
        </PaperCard>

        {/* 测试卡片 3 */}
        <PaperCard
          delayIndex={2}
          tiltAngle={2.5}
          className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/80 hover:border-emerald-400/60 dark:hover:border-emerald-500/60 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="bouncy">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shadow-2xs">
                <Layers className="w-4 h-4" />
              </div>
            </JellyIcon>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700">
              测试卡片 #3
            </span>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span>全局状态:</span>
              <strong className={isAnimEnabled ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-slate-400"}>
                {isAnimEnabled ? "运行中" : "已停用"}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>有效倍率:</span>
              <strong className="text-cyan-700 dark:text-cyan-400 font-semibold">{effectiveSpeed.toFixed(2)}x</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>切页过渡:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {(settings.tab_transition_duration ?? 180) === 0 ? "0ms (直切)" : `${settings.tab_transition_duration ?? 180}ms`}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>纸片飘落:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {settings.paper_flutter ? "已开启" : "已跳过"}
              </strong>
            </div>
          </div>
        </PaperCard>
      </PaperContainer>
    </PaperCard>
  );
};
