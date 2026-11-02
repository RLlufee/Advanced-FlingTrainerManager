/**
 * @file AppearanceTab.tsx
 * @description 设置中心 - 启动器外观与个性化皮肤主题中枢
 */

import React, { useState } from "react";
import {
  Palette,
  Check,
  Pipette,
  Sparkles,
  Download,
  ShieldCheck,
  Layers,
  Heart,
  Sun,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";
import { useTheme } from "../ui/theme";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { FluidSlider } from "../ui/motion/FluidSlider";
import { normalizeHex } from "../ui/theme/themePresets";

export const AppearanceTab: React.FC = () => {
  const {
    accentColor,
    customHex,
    currentAccent,
    presets,
    setAccentColor,
    setCustomHex,
    isCustom,
  } = useTheme();

  // 自定义十六进制输入框本地状态
  const [hexInput, setHexInput] = useState<string>(customHex || "#06b6d4");
  const [previewSliderVal, setPreviewSliderVal] = useState<number>(68);

  const handleHexSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const valid = normalizeHex(hexInput);
    if (valid) {
      setCustomHex(valid);
    }
  };

  return (
    <PaperContainer staggerDelay={0.05} className="space-y-6">
      {/* 头部标题与引导 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <JellyIcon intensity="gentle">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: currentAccent.primary }}
              >
                <Palette className="w-4 h-4" />
              </div>
            </JellyIcon>
            <span>外观与个性化主题</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: currentAccent.soft,
                color: currentAccent.text,
                border: `1px solid ${currentAccent.border}`,
              }}
            >
              0ms 实时全域换肤
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            定制启动器全局核心强调色与视觉风格，配置自动同步保存并在全站即时生效喵~
          </p>
        </div>

        {/* 一键恢复默认配色 */}
        <TypewriterTooltip text="将主题强调色恢复为官方经典青空之蓝" position="top">
          <button
            onClick={() => {
              setAccentColor("cyan");
              setHexInput("#06b6d4");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认青蓝</span>
          </button>
        </TypewriterTooltip>
      </div>

      {/* 卡片 1：主题强调色矩阵调色盘 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">官方推荐强调色调色盘</h3>
            <span className="text-[11px] text-slate-400">（共 8 款经典二次元与极客色系）</span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            当前色号: <strong className="text-slate-800">{currentAccent.primary}</strong>
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
                    ? "bg-slate-50/80 shadow-xs"
                    : "bg-white hover:bg-slate-50/60 border-slate-200/70 hover:border-slate-300"
                }`}
                style={{
                  borderColor: isSelected ? p.primary : undefined,
                  boxShadow: isSelected ? `0 0 0 1.5px ${p.primary}` : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  {/* 圆形色块 */}
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

                  {/* 色号预览 */}
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600">
                    {p.primary}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {isSelected && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: p.primary }}
                      />
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5" title={p.tagline}>
                    {p.tagline}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 自定义颜色拾色器输入栏 */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pipette className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-700">想要更独特的颜色？支持自定义 Hex</span>
          </div>

          <form onSubmit={handleHexSubmit} className="flex items-center gap-2">
            {/* HTML 原生取色盘触发器 */}
            <div className="relative flex items-center">
              <input
                type="color"
                value={normalizeHex(hexInput) || "#06b6d4"}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  setCustomHex(e.target.value);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shadow-2xs overflow-hidden p-0 bg-transparent"
                title="打开系统调色盘精选颜色"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="#3b82f6"
                className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-800"
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

      {/* 卡片 2：个性化即时效果预览沙盒 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: currentAccent.primary }} />
            <h3 className="text-sm font-bold text-slate-900">强调色即时交互沙盒 (Live Sandbox)</h3>
          </div>
          <span className="text-[11px] text-slate-400">切换上方颜色，下方控件光速响应换装</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* 样例 1：主力操作按键 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-500">主力操作按钮高亮</span>
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
              <span className="text-[11px] font-medium text-slate-500">微拟物徽章与状态</span>
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
              <span className="text-[11px] font-medium text-slate-500">果冻图标与发光</span>
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
                  <span className="font-semibold text-slate-700 block">鼠标悬停感受弹力</span>
                  <span className="text-[10px] text-slate-400">支持 3 级物理挤压</span>
                </div>
              </div>
            </div>
          </div>

          {/* 样例 4：流体滑块微控件联动 */}
          <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">流体滑块发光与填充跟随联动</span>
              <span className="font-mono font-bold" style={{ color: currentAccent.primary }}>
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

      {/* 卡片 3：个性化进阶规划路线 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>个性化皮肤未来蓝图</span>
          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
            后续规划
          </span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* 明暗模式 */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3 opacity-80">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 border border-amber-200/60">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">深浅外观模式切换</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-mono">
                  即将推出
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                支持浅色模式（默认）、纯净暗夜深色模式与跟随 Windows 系统外观自动切换。
              </p>
            </div>
          </div>

          {/* 自定义壁纸与毛玻璃 */}
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-start gap-3 opacity-80">
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 shrink-0 border border-cyan-200/60">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">自定义壁纸与毛玻璃 (Mica)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-mono">
                  规划中
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                支持导入本地二次元/游戏壁纸，调节卡片半透明度与磨砂毛玻璃虚化模糊深度。
              </p>
            </div>
          </div>
        </div>
      </PaperCard>
    </PaperContainer>
  );
};
