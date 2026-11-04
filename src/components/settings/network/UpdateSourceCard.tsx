import React from "react";
import { Zap } from "lucide-react";
import { NetworkSettings } from "../../../services/configApi";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";

interface UpdateSourceCardProps {
  updateSource: NetworkSettings["update_source"];
  onUpdateSource: (source: NetworkSettings["update_source"]) => void;
}

export const UpdateSourceCard: React.FC<UpdateSourceCardProps> = ({
  updateSource,
  onUpdateSource,
}) => {
  return (
    <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center gap-3">
        <JellyIcon intensity="bouncy">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Zap className="w-4 h-4 stroke-[2]" />
          </div>
        </JellyIcon>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            更新源与海外镜像加速
          </h2>
          <p className="text-xs text-slate-400">
            解决国内网络直接访问 GitHub 慢、连接重置或更新检测超时的问题
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 官方源 */}
        <div
          onClick={() => onUpdateSource("official")}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
            updateSource === "official"
              ? "border-cyan-500 bg-cyan-50/40 shadow-xs"
              : "border-slate-200/80 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">GitHub 官方源 (直连)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              国际直连
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            直接连接 GitHub 官方节点，适合有稳定海外网络或开启全局代理的玩家
          </p>
        </div>

        {/* ghproxy 免翻加速 */}
        <div
          onClick={() => onUpdateSource("ghproxy")}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
            updateSource === "ghproxy"
              ? "border-cyan-500 bg-cyan-50/40 shadow-xs"
              : "border-slate-200/80 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-900">国内免翻镜像 (推荐✨)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-semibold">
              高速反代
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            通过 ghproxy 极速 CDN 节点拉取，国内无需开启科学上网即可秒级检测与下载
          </p>
        </div>

        {/* 备用镜像通道 */}
        <div
          onClick={() => onUpdateSource("mirror2")}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
            updateSource === "mirror2"
              ? "border-cyan-500 bg-cyan-50/40 shadow-xs"
              : "border-slate-200/80 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">国内镜像备用节点</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
              多线容灾
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            提供多节点负载均衡备用线路，当主镜像节点临时维护时自动平稳回退
          </p>
        </div>
      </div>
    </PaperCard>
  );
};
