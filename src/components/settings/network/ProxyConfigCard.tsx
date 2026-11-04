import React from "react";
import {
  Globe,
  Radio,
  Wifi,
  Zap,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { NetworkSettings, NetworkTestResult } from "../../../services/configApi";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../../ui/motion/TypewriterTooltip";

interface ProxyConfigCardProps {
  network: NetworkSettings;
  testResult: NetworkTestResult | null;
  isTestingNetwork: boolean;
  testTarget: string;
  onUpdateNetwork: (partial: Partial<NetworkSettings>) => void;
  onTestNetwork: () => void;
  onTestTargetChange: (target: string) => void;
}

export const ProxyConfigCard: React.FC<ProxyConfigCardProps> = ({
  network,
  testResult,
  isTestingNetwork,
  testTarget,
  onUpdateNetwork,
  onTestNetwork,
  onTestTargetChange,
}) => {
  return (
    <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
      <div className="flex items-center gap-3">
        <JellyIcon intensity="bouncy">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
            <Globe className="w-4 h-4 stroke-[2]" />
          </div>
        </JellyIcon>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            网络代理与分流模式
          </h2>
          <p className="text-xs text-slate-400">
            配置本地 HTTP / SOCKS5 代理客户端（如 Clash、v2rayN、Mihomo 等），彻底打通风灵月影官网与海外资源
          </p>
        </div>
      </div>

      {/* 代理模式选择胶囊 */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-xl">
        <button
          type="button"
          onClick={() => onUpdateNetwork({ proxy_mode: "system" })}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            network.proxy_mode === "system"
              ? "bg-white text-cyan-800 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <JellyIcon intensity="gentle">
            <Radio className="w-3.5 h-3.5 text-cyan-600" />
          </JellyIcon>
          <span>跟随系统代理</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdateNetwork({ proxy_mode: "custom" })}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            network.proxy_mode === "custom"
              ? "bg-white text-cyan-800 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <JellyIcon intensity="gentle">
            <Wifi className="w-3.5 h-3.5 text-cyan-600" />
          </JellyIcon>
          <span>自定义本地代理</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdateNetwork({ proxy_mode: "direct" })}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            network.proxy_mode === "direct"
              ? "bg-white text-cyan-800 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <JellyIcon intensity="gentle">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </JellyIcon>
          <span>直接连接 (禁用代理)</span>
        </button>
      </div>

      {/* 自定义本地代理配置区 */}
      {network.proxy_mode === "custom" && (
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-600" />
              <span>自定义代理服务器 URL (支持 HTTP / SOCKS5 协议)</span>
            </label>
            <input
              type="text"
              value={network.proxy_url}
              onChange={(e) =>
                onUpdateNetwork({ proxy_url: e.target.value })
              }
              placeholder="例如: http://127.0.0.1:7890 或 socks5://127.0.0.1:7890"
              className="w-full font-mono text-xs px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-2xs"
            />
          </div>

          {/* 快捷端口标签 */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-400 font-medium">常用本地端口快捷填入:</span>
            <button
              type="button"
              onClick={() =>
                onUpdateNetwork({ proxy_url: "http://127.0.0.1:7890" })
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
            >
              Clash / Mihomo: 7890
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateNetwork({ proxy_url: "http://127.0.0.1:10809" })
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
            >
              v2rayN / Xray: 10809
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateNetwork({ proxy_url: "socks5://127.0.0.1:7890" })
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
            >
              SOCKS5: 7890
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateNetwork({ proxy_url: "http://127.0.0.1:1080" })
              }
              className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
            >
              Shadowsocks: 1080
            </button>
          </div>
        </div>
      )}

      {/* 连通性测试区 */}
      <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <JellyIcon intensity="gentle">
              <Activity className="w-3.5 h-3.5 text-cyan-600" />
            </JellyIcon>
            <span>网络与代理连通性实时诊断</span>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={testTarget}
              onChange={(e) => onTestTargetChange(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="https://flingtrainer.com">风灵月影官网 (flingtrainer.com)</option>
              <option value="https://api.github.com">GitHub 官方 API (api.github.com)</option>
              <option value="https://store.steampowered.com">Steam 商店 API (steampowered.com)</option>
            </select>

            <TypewriterTooltip text="向目标服务器发起高精度延迟探测请求" position="left">
              <button
                type="button"
                onClick={onTestNetwork}
                disabled={isTestingNetwork}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingNetwork ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>测试中...</span>
                  </>
                ) : (
                  <>
                    <JellyIcon intensity="bouncy">
                      <Zap className="w-3.5 h-3.5" />
                    </JellyIcon>
                    <span>测试连通性</span>
                  </>
                )}
              </button>
            </TypewriterTooltip>
          </div>
        </div>

        {/* 测速结果徽章展示 */}
        {testResult && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>响应耗时: <strong>{testResult.latency_ms} ms</strong></span>
              {testResult.status_code && <span>状态码: HTTP {testResult.status_code}</span>}
            </div>
          </div>
        )}
      </div>
    </PaperCard>
  );
};
