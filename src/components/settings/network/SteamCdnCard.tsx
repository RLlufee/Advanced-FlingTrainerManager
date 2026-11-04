import React from "react";
import { Layers } from "lucide-react";
import { NetworkSettings } from "../../../services/configApi";
import { PaperCard } from "../../ui/motion/PaperFlutter";
import { JellyIcon } from "../../ui/motion/JellyIcon";

interface SteamCdnCardProps {
  enableSteamCdn: boolean;
  steamCdnHost: string;
  onUpdateNetwork: (partial: Partial<NetworkSettings>) => void;
}

export const SteamCdnCard: React.FC<SteamCdnCardProps> = ({
  enableSteamCdn,
  steamCdnHost,
  onUpdateNetwork,
}) => {
  return (
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
                enable_steam_cdn: !enableSteamCdn,
              })
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enableSteamCdn ? "bg-cyan-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                enableSteamCdn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* CDN 域名路线选择 */}
        {enableSteamCdn && (
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700">CDN 边缘加速线路选择</span>
              <p className="text-[11px] text-slate-400">若某种线路偶尔加载缓慢可切换到另一条</p>
            </div>
            <select
              value={steamCdnHost}
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
  );
};
