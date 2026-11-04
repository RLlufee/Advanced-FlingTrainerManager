import React from "react";
import { Wand2 } from "lucide-react";

interface PlaygroundPresetsProps {
  onApplyPreset: (preset: "immersive" | "classic" | "floating" | "minimal") => void;
}

export const PlaygroundPresets: React.FC<PlaygroundPresetsProps> = ({
  onApplyPreset,
}) => {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Wand2 className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          游乐场灵感预设：
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onApplyPreset("immersive")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-primary/40 bg-white dark:bg-slate-800 hover:bg-primary-soft text-primary transition-colors cursor-pointer"
        >
          🌟 全域极光沉浸
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset("classic")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          📐 经典侧栏透视
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset("floating")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          🃏 纯净卡片悬浮
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset("minimal")}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          🧼 极简底衬渗透
        </button>
      </div>
    </div>
  );
};
