import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Gauge,
  Sliders,
  RotateCcw,
  MousePointerClick,
  Layers,
  Heart,
  Gamepad2,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAnimationConfig } from "../ui/motion/AnimationContext";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { JellyIntensity } from "../../services/configApi";

export const AnimationTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    isAnimEnabled,
    effectiveSpeed,
    jellyIntensity,
  } = useAnimationConfig();

  // 游乐场重新触发纸片入场测试 key
  const [playgroundKey, setPlaygroundKey] = useState<number>(0);

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
        });
        break;
    }
    setPlaygroundKey((k) => k + 1);
  };

  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4 select-none">
      {/* 卡片 1：总开关与四大 PCL-CE 风格预设 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <JellyIcon intensity="bouncy">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </JellyIcon>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  界面动效总控与 PCL-CE 风格预设
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700">
                  Motion 14 驱动
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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
                settings.enabled ? "bg-cyan-600" : "bg-slate-300"
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
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-700 block mb-2.5">
            一键风格预设档位 (点击即时切换)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. 优雅微拟物 */}
            <div
              onClick={() => applyPreset("balanced")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
                settings.enabled && settings.speed_multiplier === 1.0 && settings.jelly_intensity === "medium"
                  ? "bg-cyan-50/50 border-cyan-400 ring-1 ring-cyan-400/20 shadow-xs"
                  : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <JellyIcon intensity="gentle">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  </JellyIcon>
                  优雅微拟物
                </span>
                <span className="text-[10px] text-cyan-600 font-semibold">推荐</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                1.0x 均衡流体质感，纸片与磁吸完整呈现
              </p>
            </div>

            {/* 2. Q 弹布丁 */}
            <div
              onClick={() => applyPreset("pudding")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
                settings.enabled && settings.jelly_intensity === "bouncy"
                  ? "bg-amber-50/50 border-amber-400 ring-1 ring-amber-400/20 shadow-xs"
                  : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <JellyIcon intensity="bouncy">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  </JellyIcon>
                  Q 弹布丁
                </span>
                <span className="text-[10px] text-amber-600 font-semibold">超解压</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                夸张的果冻弹性回弹与活泼的物理形变
              </p>
            </div>

            {/* 3. 极速电竞 */}
            <div
              onClick={() => applyPreset("esports")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
                settings.enabled && settings.speed_multiplier >= 30
                  ? "bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400/20 shadow-xs"
                  : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <JellyIcon intensity="gentle">
                    <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  </JellyIcon>
                  极速电竞
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">0ms 瞬切</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                无任何等待过渡，高刷新率极客首选
              </p>
            </div>

            {/* 4. 纯净静止 */}
            <div
              onClick={() => applyPreset("static")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 group ${
                !settings.enabled
                  ? "bg-slate-100 border-slate-400 ring-1 ring-slate-400/20 shadow-xs"
                  : "bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  纯净静止
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">性能</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                彻底停用动效，极致精简与低功耗
              </p>
            </div>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 2：PCL-CE 同款动画速率无级微调滑块 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <Gauge className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              动效速率与打字速度无级微调
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              对应 PCL-CE <code>Animations.aniSpeed</code> 算法。拉到最右端可直达 30+ 瞬间完成模式。
            </p>
          </div>
        </div>

        {/* 滑块 1：全局动效速度倍率 */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              全局动效速度倍率 (Animation Speed Multiplier)
            </span>
            <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md border border-cyan-200">
              {settings.speed_multiplier >= 30 ? "⚡ 瞬间完成 (>=30)" : `${settings.speed_multiplier.toFixed(2)}x`}
            </span>
          </div>
          <input
            type="range"
            min="0.25"
            max="3.0"
            step="0.05"
            value={settings.speed_multiplier >= 30 ? 3.0 : settings.speed_multiplier}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateSettings({ speed_multiplier: val });
            }}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0.25x (慢镜头特写)</span>
            <span>1.00x (标准均衡)</span>
            <span>2.00x (干脆利落)</span>
            <span>3.00x (极限飞速)</span>
          </div>
        </div>

        {/* 滑块 2：打字机提示渲染间隔 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-amber-600" />
              打字机提示字符显现间隔 (Typewriter Speed)
            </span>
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              {settings.typewriter_speed === 0 ? "即时显现 (0ms)" : `${settings.typewriter_speed} ms / 字符`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="2"
            value={settings.typewriter_speed}
            onChange={(e) => updateSettings({ typewriter_speed: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 ms (直接显示无打字)</span>
            <span>18 ms (推荐标准)</span>
            <span>40 ms (复古终端打字)</span>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 3：细粒度微交互独立开关 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
              <Sliders className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              微交互维度定制开关
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              随心组合不同的物理动效模块，定制专属的手感偏好。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3.5">
          {/* 1. 3D 纸片飘落 */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-800">
                3D 纸片悬浮飘落入场 (Paper Flutter)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                切换标签页或打开修改器时，模块卡片带有轻微倾角与层次交错瀑布流落入位置
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ paper_flutter: !settings.paper_flutter })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.paper_flutter ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  settings.paper_flutter ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 2. 磁吸跟手与滑行药丸 */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-800">
                磁吸光标跟手与流体滑动指示药丸 (Magnetic Pull)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                选项卡随鼠标微弱吸引拉伸，切换时背景深色药丸在按钮间无缝穿梭滑动
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ magnetic_tabs: !settings.magnetic_tabs })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.magnetic_tabs ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  settings.magnetic_tabs ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 3. 果冻形变强度选择 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-xs font-bold text-slate-800">
                图标 Q 弹果冻弹性强度 (Jelly Morph Intensity)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                鼠标经过图标与按钮时的物理弹性挤压幅度
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
              {(["off", "gentle", "medium", "bouncy"] as JellyIntensity[]).map((level) => {
                const labelMap: Record<JellyIntensity, string> = {
                  off: "关闭",
                  gentle: "柔和",
                  medium: "适中",
                  bouncy: "Q 弹",
                };
                const isSelected = settings.jelly_intensity === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateSettings({ jelly_intensity: level })}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {labelMap[level]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 4：🎮 实时交互调试游乐场 (Interactive Playground) */}
      <PaperCard className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/80 text-white shadow-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <JellyIcon intensity="bouncy">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Gamepad2 className="w-4 h-4" />
              </div>
            </JellyIcon>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>实时交互调试游乐场</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-full">
                  无需切页 · 晃动鼠标即时预览
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                调节上方滑块或预设后，可在此测试卡片直接感受真实的弹性与入场动效喵~
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setPlaygroundKey((k) => k + 1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
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
            className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-cyan-500/60 transition-colors flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <JellyIcon intensity="bouncy">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Heart className="w-4 h-4 fill-cyan-400" />
                </div>
              </JellyIcon>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
                测试卡片 #1
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">鼠标移入测试果冻形变</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                当前果冻档位: <strong>{jellyIntensity}</strong>
              </p>
            </div>
          </PaperCard>

          {/* 测试卡片 2 */}
          <PaperCard
            delayIndex={1}
            tiltAngle={2.5}
            className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-amber-500/60 transition-colors flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <JellyIcon intensity="bouncy">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4 fill-amber-400" />
                </div>
              </JellyIcon>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
                测试卡片 #2
              </span>
            </div>
            <div>
              <TypewriterTooltip text="恭喜主人！打字机提示与纸片动效已全域完美联动喵~" position="top">
                <button className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-[11px] font-semibold text-amber-300 cursor-help">
                  悬浮测试打字机提示 ❯
                </button>
              </TypewriterTooltip>
            </div>
          </PaperCard>

          {/* 测试卡片 3 */}
          <PaperCard
            delayIndex={2}
            tiltAngle={2.5}
            className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 hover:border-emerald-500/60 transition-colors flex flex-col justify-between space-y-3 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <JellyIcon intensity="bouncy">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
              </JellyIcon>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
                测试卡片 #3
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
              <div>全局状态: <strong className={isAnimEnabled ? "text-emerald-400" : "text-slate-400"}>{isAnimEnabled ? "运行中" : "已停用"}</strong></div>
              <div>有效倍率: <strong className="text-cyan-400">{effectiveSpeed.toFixed(2)}x</strong></div>
              <div>飘落状态: <strong className="text-emerald-400">{settings.paper_flutter ? "已开启" : "已跳过"}</strong></div>
            </div>
          </PaperCard>
        </PaperContainer>
      </PaperCard>

      {/* 底部重置操作条 */}
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>动效配置实时自动落盘保存至 <code>app_config.json</code></span>
        </span>
        <TypewriterTooltip text="将所有动效参数恢复为官方出厂均衡推荐" position="top">
          <button
            type="button"
            onClick={resetSettings}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <JellyIcon intensity="gentle">
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </JellyIcon>
            <span>恢复动效出厂默认</span>
          </button>
        </TypewriterTooltip>
      </div>
    </PaperContainer>
  );
};