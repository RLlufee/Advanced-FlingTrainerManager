/**
 * @file InteractiveSandboxCard.tsx
 * @description 个性化强调色即时交互沙盒卡片 (Live Sandbox)
 */

import React, { useState } from "react";
import { Sparkles, Download, Layers, ShieldCheck, Heart } from "lucide-react";
import { useTheme } from "../../ui/theme";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { FluidSlider } from "../../ui/motion/FluidSlider";

export const InteractiveSandboxCard: React.FC = () => {
  const { currentAccent } = useTheme();
  const [previewSliderVal, setPreviewSliderVal] = useState<number>(68);

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: currentAccent.primary }} />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            强调色即时交互沙盒 (Live Sandbox)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          切换上方颜色或莫奈色票，下方控件光速响应换装
        </span>
      </div>

      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* 样例 1：主力操作按键 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              主力操作按钮高亮
            </span>
            <div>
              <button
                className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                style={{
                  background: currentAccent.gradient,
                  boxShadow: `0 4px 12px ${currentAccent.glow}`,
                }}
              >
                <Download className="w-4 h-4" />
                <span>一键下载并安装修改器</span>
              </button>
            </div>
          </div>

          {/* 样例 2：胶囊属性徽章群 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              微拟物徽章与状态
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                style={{
                  backgroundColor: currentAccent.soft,
                  color: currentAccent.text,
                  border: `1px solid ${currentAccent.border}`,
                }}
              >
                <Layers className="w-3.5 h-3.5" />
                修改器 v1.4.0
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: currentAccent.soft,
                  color: currentAccent.text,
                  border: `1px solid ${currentAccent.border}`,
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                已就绪
              </span>
            </div>
          </div>

          {/* 样例 3：果冻弹性回弹图标 */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              果冻图标与发光
            </span>
            <div className="flex items-center gap-3">
              <JellyIcon intensity="bouncy">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-transform shadow-xs"
                  style={{
                    backgroundColor: currentAccent.soft,
                    border: `1px solid ${currentAccent.border}`,
                    color: currentAccent.primary,
                  }}
                >
                  <Heart className="w-4 h-4 fill-current" />
                </div>
              </JellyIcon>
              <div className="text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  鼠标悬停感受弹力
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  支持 3 级物理挤压
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 样例 4：流体滑块微控件联动 */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              流体滑块发光与填充跟随联动
            </span>
            <span
              className="font-mono font-bold"
              style={{ color: currentAccent.primary }}
            >
              {previewSliderVal}%
            </span>
          </div>
          <FluidSlider
            value={previewSliderVal}
            min={0}
            max={100}
            step={1}
            onChange={setPreviewSliderVal}
            formatValue={(v) => `${v}%`}
          />
        </div>
      </div>
    </PaperCard>
  );
};
