import React, { useState } from "react";
import { Info, RotateCcw } from "lucide-react";
import { useAnimationConfig } from "../ui/motion/AnimationContext";
import { PaperContainer } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import {
  AnimationPresetCards,
  AnimationSlidersCard,
  MicroInteractionsCard,
  AnimationPlaygroundCard,
} from "./animation";

export const AnimationTab: React.FC = () => {
  const { resetSettings } = useAnimationConfig();

  // 游乐场重新触发纸片入场测试 key
  const [playgroundKey, setPlaygroundKey] = useState<number>(0);

  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4 select-none">
      {/* 卡片 1：总开关与四大 PCL-CE 风格预设 */}
      <AnimationPresetCards onPresetApplied={() => setPlaygroundKey((k) => k + 1)} />

      {/* 卡片 2：PCL-CE 同款动画速率与切页时长无级微调滑块 */}
      <AnimationSlidersCard />

      {/* 卡片 3：细粒度微交互独立开关 */}
      <MicroInteractionsCard />

      {/* 卡片 4：实时交互调试游乐场 */}
      <AnimationPlaygroundCard
        playgroundKey={playgroundKey}
        onRefreshPlayground={() => setPlaygroundKey((k) => k + 1)}
      />

      {/* 底部重置操作条 */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>动效配置实时自动落盘保存至 <code>app_config.json</code></span>
        </span>
        <TypewriterTooltip text="将所有动效参数恢复为官方出厂均衡推荐" position="top">
          <button
            type="button"
            onClick={resetSettings}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <JellyIcon intensity="gentle">
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            </JellyIcon>
            <span>恢复动效出厂默认</span>
          </button>
        </TypewriterTooltip>
      </div>
    </PaperContainer>
  );
};
