/**
 * @file ThemeAccentCard.tsx
 * @description 主题强调色调色盘卡片（含 8 款官方推荐色系、莫奈动态取色与自定义 Hex 输入栏）
 */

import React, { useState, useEffect } from "react";
import { Check, Pipette } from "lucide-react";
import { useTheme } from "../../ui/theme";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { normalizeHex } from "../../ui/theme/themePresets";
import { MonetDynamicSection } from "./MonetDynamicSection";

export const ThemeAccentCard: React.FC = () => {
  const {
    currentAccent,
    presets,
    accentColor,
    setAccentColor,
    customHex,
    setCustomHex,
    isCustom,
  } = useTheme();

  const [hexInput, setHexInput] = useState<string>(customHex || "#06b6d4");

  useEffect(() => {
    if (customHex) {
      setHexInput(customHex);
    }
  }, [customHex]);

  const handleHexSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const valid = normalizeHex(hexInput);
    if (valid) {
      setCustomHex(valid);
    }
  };

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            官方推荐强调色调色盘
          </h3>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            （8 款固定色系 + 莫奈智能动态取色）
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>当前生效:</span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shadow-2xs"
            style={{ backgroundColor: currentAccent.primary }}
          />
          <strong className="text-slate-800 dark:text-slate-200">{currentAccent.primary}</strong>
        </span>
      </div>

      {/* 8 种预设色卡网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {presets.map((p) => {
          const isSelected = accentColor === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setAccentColor(p.id)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none ${
                isSelected
                  ? "bg-slate-50/80 dark:bg-slate-800/80 shadow-xs"
                  : "bg-white dark:bg-slate-900/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
              style={{
                borderColor: isSelected ? p.primary : undefined,
                boxShadow: isSelected ? `0 0 0 1.5px ${p.primary}` : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <JellyIcon intensity="gentle">
                  <div
                    className="w-7 h-7 rounded-full shadow-xs flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      background: p.gradient,
                      boxShadow: `0 2px 8px ${p.glow}`,
                    }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                  </div>
                </JellyIcon>

                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {p.primary}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>{p.name}</span>
                  {isSelected && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: p.primary }}
                    />
                  )}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={p.tagline}>
                  {p.tagline}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 莫奈「动态取色」入口 + 动画抽屉 */}
      <MonetDynamicSection />

      {/* 自定义颜色拾色器输入栏 */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pipette className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            想要精确指定固定色号？支持手动自定义 Hex
          </span>
        </div>

        <form onSubmit={handleHexSubmit} className="flex items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="color"
              value={normalizeHex(hexInput) || "#06b6d4"}
              onChange={(e) => {
                setHexInput(e.target.value);
                setCustomHex(e.target.value);
              }}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden p-0 bg-transparent"
              title="打开系统调色盘精选颜色"
            />
          </div>

          <div className="relative">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="#3b82f6"
              className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-slate-750 text-slate-800 dark:text-slate-100"
              style={{
                borderColor: isCustom ? currentAccent.primary : undefined,
              }}
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer active:scale-95"
            style={{
              backgroundColor: currentAccent.primary,
            }}
          >
            应用色号
          </button>
        </form>
      </div>
    </PaperCard>
  );
};
