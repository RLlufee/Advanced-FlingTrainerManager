/**
 * @file ColorModeCard.tsx
 * @description 界面深浅色彩模式与主题渐变背景卡片
 */

import React from "react";
import { Monitor, Sun, Moon, Check, Waves } from "lucide-react";
import { useTheme } from "../../ui/theme";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";

export const ColorModeCard: React.FC = () => {
  const {
    colorMode,
    resolvedColorMode,
    setColorMode,
    gradientBackground,
    setGradientBackground,
    currentAccent,
  } = useTheme();

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            界面深浅色彩模式
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            （默认自动跟随系统，亦可固定浅色或深色）
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>当前生效:</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{
              backgroundColor: currentAccent.soft,
              color: currentAccent.text,
              border: `1px solid ${currentAccent.border}`,
            }}
          >
            {colorMode === "system"
              ? `跟随系统 (${resolvedColorMode === "dark" ? "深色" : "浅色"})`
              : colorMode === "dark"
              ? "极客深色"
              : "明亮浅色"}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 跟随系统选项 */}
        <div
          onClick={() => setColorMode("system")}
          className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none ${
            colorMode === "system"
              ? "bg-primary-soft/40 border-primary shadow-xs"
              : "bg-white dark:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 border-slate-200/70 dark:border-slate-800"
          }`}
          style={{
            borderColor: colorMode === "system" ? currentAccent.primary : undefined,
            boxShadow:
              colorMode === "system" ? `0 0 0 1.5px ${currentAccent.primary}` : undefined,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <JellyIcon intensity="gentle">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor:
                      colorMode === "system" ? currentAccent.primary : undefined,
                    color: colorMode === "system" ? "#ffffff" : undefined,
                  }}
                >
                  <Monitor
                    className={`w-4 h-4 ${
                      colorMode === "system"
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400 group-hover:text-primary"
                    }`}
                  />
                </div>
              </JellyIcon>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>跟随系统</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    默认推荐
                  </span>
                </h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Windows 系统首选
                </span>
              </div>
            </div>
            {colorMode === "system" && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: currentAccent.primary }}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            随 Windows 系统夜间/深浅主题自动无缝切换，当前检测为{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {resolvedColorMode === "dark" ? "深色夜空" : "明亮浅色"}
            </strong>
          </p>
        </div>

        {/* 浅色模式 */}
        <div
          onClick={() => setColorMode("light")}
          className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none ${
            colorMode === "light"
              ? "bg-primary-soft/40 border-primary shadow-xs"
              : "bg-white dark:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 border-slate-200/70 dark:border-slate-800"
          }`}
          style={{
            borderColor: colorMode === "light" ? currentAccent.primary : undefined,
            boxShadow:
              colorMode === "light" ? `0 0 0 1.5px ${currentAccent.primary}` : undefined,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <JellyIcon intensity="gentle">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor:
                      colorMode === "light" ? currentAccent.primary : undefined,
                    color: colorMode === "light" ? "#ffffff" : undefined,
                  }}
                >
                  <Sun
                    className={`w-4 h-4 ${
                      colorMode === "light"
                        ? "text-white"
                        : "text-amber-500 group-hover:scale-110 transition-transform"
                    }`}
                  />
                </div>
              </JellyIcon>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  明亮浅色
                </h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Light Mode
                </span>
              </div>
            </div>
            {colorMode === "light" && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: currentAccent.primary }}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            纯净明亮，文字通透高反差，适合明朗白昼环境与习惯经典浅底的用户
          </p>
        </div>

        {/* 深色模式 */}
        <div
          onClick={() => setColorMode("dark")}
          className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none ${
            colorMode === "dark"
              ? "bg-primary-soft/40 border-primary shadow-xs"
              : "bg-white dark:bg-slate-900/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 border-slate-200/70 dark:border-slate-800"
          }`}
          style={{
            borderColor: colorMode === "dark" ? currentAccent.primary : undefined,
            boxShadow:
              colorMode === "dark" ? `0 0 0 1.5px ${currentAccent.primary}` : undefined,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <JellyIcon intensity="gentle">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor:
                      colorMode === "dark" ? currentAccent.primary : undefined,
                    color: colorMode === "dark" ? "#ffffff" : undefined,
                  }}
                >
                  <Moon
                    className={`w-4 h-4 ${
                      colorMode === "dark"
                        ? "text-white"
                        : "text-indigo-400 group-hover:scale-110 transition-transform"
                    }`}
                  />
                </div>
              </JellyIcon>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  沉浸深色
                </h4>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Dark Mode
                </span>
              </div>
            </div>
            {colorMode === "dark" && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: currentAccent.primary }}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            深邃深空黑灰层次，柔和护眼，大幅降低暗光眩光，尽显游戏极客质感
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-900/40 px-3.5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
            style={{ background: currentAccent.gradient }}
          >
            <Waves className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              主题渐变背景
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              根据强调色生成相邻色相渐变，并随深浅模式调整明度
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={gradientBackground}
          aria-label="启用主题渐变背景"
          onClick={() => setGradientBackground(!gradientBackground)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            gradientBackground ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              gradientBackground ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </PaperCard>
  );
};
