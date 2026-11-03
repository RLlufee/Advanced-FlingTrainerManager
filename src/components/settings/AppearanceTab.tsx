/**
 * @file AppearanceTab.tsx
 * @description 设置中心 - 启动器外观与个性化皮肤主题中枢（组合式高内聚门面组件）
 */

import React from "react";
import { Palette, RotateCcw } from "lucide-react";
import { useTheme } from "../ui/theme";
import { PaperContainer } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { WallpaperSection } from "./WallpaperSection";
import {
  ColorModeCard,
  ThemeAccentCard,
  InteractiveSandboxCard,
  AppearanceCapabilitiesCard,
} from "./appearance";

export const AppearanceTab: React.FC = () => {
  const { currentAccent, setAccentColor } = useTheme();

  return (
    <PaperContainer staggerDelay={0.05} className="max-w-4xl mx-auto space-y-4">
      {/* 头部标题与引导 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 px-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <JellyIcon intensity="gentle">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs transition-colors duration-300"
                style={{ backgroundColor: currentAccent.primary }}
              >
                <Palette className="w-4 h-4" />
              </div>
            </JellyIcon>
            <span>外观与个性化主题</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium transition-colors duration-300"
              style={{
                backgroundColor: currentAccent.soft,
                color: currentAccent.text,
                border: `1px solid ${currentAccent.border}`,
              }}
            >
              0ms 实时全域换肤
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            定制启动器全局核心强调色与莫奈动态取色引擎，配置自动持久化保存并在全站即时生效喵~
          </p>
        </div>

        {/* 一键恢复默认配色 */}
        <TypewriterTooltip text="将主题强调色恢复为官方经典青空之蓝" position="top">
          <button
            onClick={() => setAccentColor("cyan")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认青蓝</span>
          </button>
        </TypewriterTooltip>
      </div>

      {/* 卡片 0：界面深浅色彩模式（默认跟随系统） */}
      <ColorModeCard />

      {/* 自定义壁纸图层与背景游乐场 */}
      <WallpaperSection />

      {/* 卡片 1：主题强调色矩阵调色盘 + 莫奈动态取色 + 自定义 Hex */}
      <ThemeAccentCard />

      {/* 卡片 2：个性化即时效果预览沙盒 */}
      <InteractiveSandboxCard />

      {/* 卡片 3：已上线的个性化外观能力 */}
      <AppearanceCapabilitiesCard />
    </PaperContainer>
  );
};
