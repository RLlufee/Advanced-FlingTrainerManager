import React from "react";
import { Gauge, Zap, Layers, MousePointerClick, Activity } from "lucide-react";
import { useAnimationConfig } from "../../ui/motion/AnimationContext";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { FluidSlider } from "../../ui/motion/FluidSlider";

export const AnimationSlidersCard: React.FC = () => {
  const { settings, updateSettings } = useAnimationConfig();

  return (
    <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-5 transition-colors">
      <div className="flex items-start gap-3.5">
        <JellyIcon intensity="gentle">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Gauge className="w-5 h-5" />
          </div>
        </JellyIcon>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            动效速率与切页时长无级微调
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            对应 PCL-CE <code>Animations.aniSpeed</code> 算法。可定制全局速度倍率、打字间隔及主标签页切换过渡时长。
          </p>
        </div>
      </div>

      {/* 滑块 1：全局动效速度倍率 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            全局动效速度倍率 (Animation Speed Multiplier)
          </span>
          <span className="font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
            {settings.speed_multiplier >= 30 ? "⚡ 瞬间完成 (>=30)" : `${settings.speed_multiplier.toFixed(2)}x`}
          </span>
        </div>
        <FluidSlider
          min={0.25}
          max={3.0}
          step={0.05}
          value={settings.speed_multiplier >= 30 ? 3.0 : settings.speed_multiplier}
          onChange={(val) => updateSettings({ speed_multiplier: val })}
          formatValue={(val) =>
            settings.speed_multiplier >= 30 && val >= 3.0
              ? "⚡ 瞬间完成"
              : `${val.toFixed(2)}x`
          }
          color="cyan"
          marks={[
            { value: 0.25, label: "0.25x (慢镜头特写)" },
            { value: 1.0, label: "1.00x (标准均衡)" },
            { value: 2.0, label: "2.00x (干脆利落)" },
            { value: 3.0, label: "3.00x (极限飞速)" },
          ]}
        />
      </div>

      {/* 滑块 2：主标签页切换过渡时长 */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            主标签页切换过渡时长 (Tab Switch Transition Duration)
          </span>
          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            {(settings.tab_transition_duration ?? 180) === 0
              ? "⚡ 即时直切 (0ms)"
              : `${settings.tab_transition_duration ?? 180} ms (${((settings.tab_transition_duration ?? 180) / 1000).toFixed(2)}s)`}
          </span>
        </div>
        <FluidSlider
          min={0}
          max={500}
          step={10}
          value={settings.tab_transition_duration ?? 180}
          onChange={(val) => updateSettings({ tab_transition_duration: val })}
          formatValue={(val) =>
            val === 0 ? "⚡ 即时直切" : `${val} ms`
          }
          color="indigo"
          marks={[
            { value: 0, label: "0 ms (无过渡直切)" },
            { value: 100, label: "100 ms (干脆利落)" },
            { value: 180, label: "180 ms (推荐默认)" },
            { value: 300, label: "300 ms (舒缓平滑)" },
            { value: 500, label: "500 ms (慢镜头特写)" },
          ]}
        />
      </div>

      {/* 滑块 3：打字机提示渲染间隔 */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            打字机提示字符显现间隔 (Typewriter Speed)
          </span>
          <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
            {settings.typewriter_speed === 0 ? "即时显现 (0ms)" : `${settings.typewriter_speed} ms / 字符`}
          </span>
        </div>
        <FluidSlider
          min={0}
          max={40}
          step={2}
          value={settings.typewriter_speed}
          onChange={(val) => updateSettings({ typewriter_speed: val })}
          formatValue={(val) =>
            val === 0 ? "即时显现 (0ms)" : `${val} ms`
          }
          color="amber"
          marks={[
            { value: 0, label: "0 ms (无打字即时)" },
            { value: 18, label: "18 ms (推荐标准)" },
            { value: 40, label: "40 ms (复古终端打字)" },
          ]}
        />
      </div>

      {/* 选项 4：渲染帧率上限与高刷适配 */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            渲染帧率上限与高刷适配 (Target Frame Rate)
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            {(settings.target_fps ?? 144) === 0 ? "⚡ 极速完全放飞 (无上限)" : `${settings.target_fps ?? 144} FPS`}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          已解除底层 WebView2 的 60Hz 节能锁频限制。配合高刷显示器与强劲多核 CPU，让页面与组件过渡丝滑如丝绸。
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {[
            { fps: 60, label: "60 FPS", desc: "节能稳妥" },
            { fps: 90, label: "90 FPS", desc: "均衡顺滑" },
            { fps: 120, label: "120 FPS", desc: "超高高刷" },
            { fps: 144, label: "144 FPS", desc: "电竞旗舰" },
            { fps: 0, label: "极速解锁", desc: "完全放飞" },
          ].map((item) => {
            const isSelected = (settings.target_fps ?? 144) === item.fps;
            return (
              <button
                key={item.fps}
                type="button"
                onClick={() => updateSettings({ target_fps: item.fps })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all border ${
                  isSelected
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-2xs font-semibold ring-2 ring-emerald-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="font-mono text-xs font-bold">{item.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </PaperCard>
  );
};
