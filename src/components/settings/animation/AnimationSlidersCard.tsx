import React from "react";
import { Gauge, Zap, Layers, MousePointerClick, Activity, RotateCw } from "lucide-react";
import { useAnimationConfig } from "../../ui/motion/AnimationContext";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { FluidSlider } from "../../ui/motion/FluidSlider";
import { FPS_TIERS, fpsNeedsUnlock } from "../../../services/configApi";
import { buttonClass } from "../../ui/buttonStyles";

export const AnimationSlidersCard: React.FC = () => {
  const { settings, updateSettings, targetFps, refreshRate, fpsNeedsRestart, restartApp } =
    useAnimationConfig();

  const tierLabel = (fps: number) => (fps === 0 ? "无上限" : `${fps}`);
  const tierHint = (fps: number) => {
    // 需要关闭垂直同步的档位：实测部分设备反而会被系统降到约 60 FPS，标注为实验性
    if (fpsNeedsUnlock(fps, refreshRate)) return "实验性";
    if (refreshRate !== null && fps === refreshRate) return "跟随显示器";
    if (fps <= 30) return "省电";
    if (fps <= 60) return "标准";
    return "流畅";
  };

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
            {settings.speed_multiplier >= 30 ? "瞬间完成" : `${settings.speed_multiplier.toFixed(2)}x`}
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
              ? "瞬间完成"
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
              ? "即时（0 ms）"
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
            val === 0 ? "即时" : `${val} ms`
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

      {/* 选项 4：渲染帧率上限 */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            帧率上限
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {refreshRate !== null ? `显示器 ${refreshRate} Hz` : "未能识别显示器刷新率"}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          不超过显示器刷新率的档位会跟随垂直同步，切换即时生效。更高的档位和「无上限」为实验性功能：会关闭垂直同步并需要重启，显示器无法显示超出刷新率的画面，部分设备上帧率反而会被系统降到约 60，并持续占用 GPU，不建议日常使用。
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
          {FPS_TIERS.map((fps) => {
            const isSelected = targetFps === fps;
            const unlock = fpsNeedsUnlock(fps, refreshRate);
            return (
              <button
                key={fps}
                type="button"
                onClick={() => updateSettings({ target_fps: fps })}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-cyan-50 border-cyan-300 text-cyan-800 ring-2 ring-cyan-500/15 dark:bg-cyan-500/10 dark:border-cyan-500/50 dark:text-cyan-200"
                    : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span className="font-mono text-sm font-semibold leading-tight">
                  {tierLabel(fps)}
                  {fps !== 0 && <span className="ml-0.5 text-[11px] font-sans font-normal opacity-70">FPS</span>}
                </span>
                <span
                  className={`text-[11px] mt-0.5 ${
                    unlock ? "text-amber-600 dark:text-amber-400" : "opacity-70"
                  }`}
                >
                  {tierHint(fps)}
                </span>
              </button>
            );
          })}
        </div>

        {fpsNeedsRestart && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30">
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {fpsNeedsUnlock(targetFps, refreshRate)
                ? "实验性档位需要重启应用才能关闭垂直同步。若重启后帧率不升反降，请改回不超过显示器刷新率的档位。"
                : "当前仍处于关闭垂直同步的状态，重启后恢复跟随显示器，降低 GPU 占用。"}
            </p>
            <button type="button" onClick={restartApp} className={buttonClass("warning", "sm", "shrink-0")}>
              <RotateCw className="w-3.5 h-3.5" />
              <span>立即重启</span>
            </button>
          </div>
        )}
      </div>
    </PaperCard>
  );
};
