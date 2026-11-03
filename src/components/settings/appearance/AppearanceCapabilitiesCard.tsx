/**
 * @file AppearanceCapabilitiesCard.tsx
 * @description 个性化外观能力说明卡片（展示已上线能力清单）
 */

import React from "react";
import { Check, Image as ImageIcon } from "lucide-react";
import { PaperCard } from "../../ui/motion/PaperFlutter";

export const AppearanceCapabilitiesCard: React.FC = () => {
  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-3">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <span>个性化外观能力</span>
        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">
          已上线
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* 明暗模式 */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200/60 dark:border-emerald-800">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                深浅外观模式切换
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono">
                已上线
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              支持跟随 Windows 系统自动变色（默认）、固定雅致明亮浅色、与纯净夜幕极客深色模式。
            </p>
          </div>
        </div>

        {/* 自定义壁纸 */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 shrink-0 border border-cyan-200/60 dark:border-cyan-800">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                自定义壁纸图库与界面透光
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-mono">
                已上线
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              可在多张壁纸间切换，并调节图片显现度、模糊和界面背景透光度。
            </p>
          </div>
        </div>
      </div>
    </PaperCard>
  );
};
