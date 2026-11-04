import React from "react";
import { Activity, RotateCcw } from "lucide-react";
import { NetworkSettings } from "../../../services/configApi";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { FluidSlider } from "../../ui/motion/FluidSlider";
import { TypewriterTooltip } from "../../ui/motion/TypewriterTooltip";

interface TimeoutRetryCardProps {
  timeoutMs: number;
  maxRetryCount: number;
  onUpdateNetwork: (partial: Partial<NetworkSettings>) => void;
  onResetNetwork: () => void;
}

export const TimeoutRetryCard: React.FC<TimeoutRetryCardProps> = ({
  timeoutMs,
  maxRetryCount,
  onUpdateNetwork,
  onResetNetwork,
}) => {
  return (
    <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center gap-3">
        <JellyIcon intensity="gentle">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <Activity className="w-4 h-4 stroke-[2]" />
          </div>
        </JellyIcon>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            网络超时与重试容错
          </h2>
          <p className="text-xs text-slate-400">
            针对不同网络环境或高延迟代理进行精细调优，提升抓取与建档成功率
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 超时滑块 */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">网络请求超时上限</span>
            <span className="text-xs font-bold text-cyan-700 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
              {(timeoutMs / 1000).toFixed(0)} 秒 ({timeoutMs}ms)
            </span>
          </div>
          <FluidSlider
            min={3000}
            max={30000}
            step={1000}
            value={timeoutMs}
            onChange={(val) => onUpdateNetwork({ timeout_ms: val })}
            formatValue={(val) => `${(val / 1000).toFixed(0)} 秒`}
            color="cyan"
            marks={[
              { value: 3000, label: "3 秒 (快速响应)" },
              { value: 8000, label: "默认 8 秒" },
              { value: 30000, label: "30 秒 (弱网宽容)" },
            ]}
          />
        </div>

        {/* 重试滑块 */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">失败自动重试次数</span>
            <span className="text-xs font-bold text-cyan-700 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
              {maxRetryCount} 次
            </span>
          </div>
          <FluidSlider
            min={0}
            max={5}
            step={1}
            value={maxRetryCount}
            onChange={(val) => onUpdateNetwork({ max_retry_count: val })}
            formatValue={(val) => `${val} 次`}
            color="cyan"
            marks={[
              { value: 0, label: "0 次 (不重试)" },
              { value: 2, label: "默认 2 次" },
              { value: 5, label: "5 次 (极限重试)" },
            ]}
          />
        </div>
      </div>

      {/* 恢复网络设置默认按钮 */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          若改错配置导致断网，可随时一键恢复出厂网络设置
        </span>
        <TypewriterTooltip text="将所有代理模式与海外镜像重置为系统出厂推荐" position="top">
          <button
            type="button"
            onClick={onResetNetwork}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <JellyIcon intensity="gentle">
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            </JellyIcon>
            <span>恢复网络设置为默认</span>
          </button>
        </TypewriterTooltip>
      </div>
    </PaperCard>
  );
};
