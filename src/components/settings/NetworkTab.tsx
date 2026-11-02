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
  Layers,
  RotateCcw,
} from "lucide-react";
import { NetworkSettings, NetworkTestResult } from "../../services/configApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

interface NetworkTabProps {
  network: NetworkSettings;
  testResult: NetworkTestResult | null;
  isTestingNetwork: boolean;
  testTarget: string;
  onUpdateNetwork: (partial: Partial<NetworkSettings>) => void;
  onTestNetwork: () => void;
  onTestTargetChange: (target: string) => void;
  onResetNetwork: () => void;
}

export const NetworkTab: React.FC<NetworkTabProps> = ({
  network,
  testResult,
  isTestingNetwork,
  testTarget,
  onUpdateNetwork,
  onTestNetwork,
  onTestTargetChange,
  onResetNetwork,
}) => {
  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 卡片 1: 本地网络代理配置 */}
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

      {/* 卡片 2: 更新源与 GitHub 镜像加速 */}
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
            onClick={() => onUpdateNetwork({ update_source: "official" })}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
              network.update_source === "official"
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
            onClick={() => onUpdateNetwork({ update_source: "ghproxy" })}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
              network.update_source === "ghproxy"
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
            onClick={() => onUpdateNetwork({ update_source: "mirror2" })}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
              network.update_source === "mirror2"
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

      {/* 卡片 3: Steam 官方海报 CDN 加速 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center gap-3">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <Layers className="w-4 h-4 stroke-[2]" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Steam 封面图片 CDN 镜像加速
            </h2>
            <p className="text-xs text-slate-400">
              针对国内部分运营商 DNS 污染导致的 Steam 游戏海报无法加载与“红叉”裂图进行智能路由
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* 开关行 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs font-semibold text-slate-800">
                启用 Steam 封面 CDN 智能加速 (建议开启⚠️)
              </span>
              <p className="text-[11px] text-slate-400">
                自动将 Steam 官方海报图片路由至国内高可用 CDN 边缘分发节点
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateNetwork({
                  enable_steam_cdn: !network.enable_steam_cdn,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                network.enable_steam_cdn ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  network.enable_steam_cdn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* CDN 域名路线选择 */}
          {network.enable_steam_cdn && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700">CDN 边缘加速线路选择</span>
                <p className="text-[11px] text-slate-400">若某种线路偶尔加载缓慢可切换到另一条</p>
              </div>
              <select
                value={network.steam_cdn_host}
                onChange={(e) =>
                  onUpdateNetwork({ steam_cdn_host: e.target.value })
                }
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
              >
                <option value="shared.cloudflare.steamstatic.com">Cloudflare 全球极速分发节点</option>
                <option value="cdn.akamai.steamstatic.com">Akamai 国内高可用节点</option>
              </select>
            </div>
          )}
        </div>
      </PaperCard>

      {/* 卡片 4: 网络超时与容错微调 */}
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
                {(network.timeout_ms / 1000).toFixed(0)} 秒 ({network.timeout_ms}ms)
              </span>
            </div>
            <input
              type="range"
              min="3000"
              max="30000"
              step="1000"
              value={network.timeout_ms}
              onChange={(e) =>
                onUpdateNetwork({ timeout_ms: Number(e.target.value) })
              }
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>3 秒 (快速响应)</span>
              <span>默认 8 秒</span>
              <span>30 秒 (弱网宽容)</span>
            </div>
          </div>

          {/* 重试滑块 */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">失败自动重试次数</span>
              <span className="text-xs font-bold text-cyan-700 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                {network.max_retry_count} 次
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={network.max_retry_count}
              onChange={(e) =>
                onUpdateNetwork({ max_retry_count: Number(e.target.value) })
              }
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 次 (不重试)</span>
              <span>默认 2 次</span>
              <span>5 次 (极限重试)</span>
            </div>
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
    </PaperContainer>
  );
};