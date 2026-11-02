import React from "react";
import {
  Zap,
  Play,
  Gamepad2,
  FolderOpen,
  Trash2,
  ShieldCheck,
  Sparkles,
  ArrowUpCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import type { InstalledTrainerRecord, TrainerUpdateInfo } from "../../services/trainerApi";
import { trainerApi } from "../../services/trainerApi";
import { GamePoster } from "../GamePoster";

export interface LaunchHeroProps {
  trainer: InstalledTrainerRecord;
  updateInfo: TrainerUpdateInfo | null;
  isLaunching: boolean;
  isEnriching: boolean;
  updatingId: string | null;
  activeOptionCount: number;
  onLaunchTrainer: () => void;
  onLaunchDual: () => void;
  onLaunchSteamOnly: () => void;
  onEnrichTrainer: () => void;
  onUpdateTrainer: () => void;
  onOpenInstallDir: () => void;
  onDeleteClick: () => void;
}

export const LaunchHero: React.FC<LaunchHeroProps> = ({
  trainer,
  updateInfo,
  isLaunching,
  isEnriching,
  updatingId,
  activeOptionCount,
  onLaunchTrainer,
  onLaunchDual,
  onLaunchSteamOnly,
  onEnrichTrainer,
  onUpdateTrainer,
  onOpenInstallDir,
  onDeleteClick,
}) => {
  return (
    <div className="relative overflow-hidden bg-white text-slate-800 border-b border-slate-200/90 shadow-2xs shrink-0">
      <div className="p-6 space-y-4">
        {/* 上层：封面 + 游戏标题 + 属性徽章 + 右侧小工具 */}
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-center gap-5 min-w-0 flex-1">
            {/* 游戏封面海报 */}
            <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-md bg-slate-100">
              <GamePoster
                key={`${trainer.id}-${trainer.capsule_image || ""}-${trainer.thumbnail || ""}-${activeOptionCount}`}
                primarySrc={trainer.capsule_image}
                secondarySrc={trainer.thumbnail}
                alt={trainer.chinese_name || trainer.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 标题与属性标签 */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  {trainer.chinese_name || trainer.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  已就绪
                </span>
              </div>

              {trainer.chinese_name && (
                <p className="text-xs text-slate-400 truncate">{trainer.name}</p>
              )}

              {/* 属性与版本徽章 */}
              <div className="flex items-center gap-2 text-[11px] flex-wrap pt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-medium shrink-0 whitespace-nowrap">
                  修改器 {trainer.version}
                </span>

                {updateInfo?.has_update && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/90 font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap animate-pulse">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>发现新版: {updateInfo.latest_version}</span>
                  </span>
                )}

                {trainer.game_version && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 shrink-0 whitespace-nowrap">
                    支持游戏: {trainer.game_version}
                  </span>
                )}

                {trainer.steam_app_id && (
                  <button
                    onClick={() => trainerApi.openSteamStore(trainer.steam_app_id!)}
                    title="在浏览器中查看 Steam 商店页"
                    className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 flex items-center gap-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Gamepad2 className="w-3 h-3 text-sky-600" />
                    <span>Steam #{trainer.steam_app_id}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </button>
                )}

                <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-1 shrink-0 whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {trainer.last_launched_at
                    ? `上次启动: ${new Date(trainer.last_launched_at).toLocaleDateString()}`
                    : "尚未启动过"}
                </span>
              </div>
            </div>
          </div>

          {/* 右上角辅助小工具：打开目录与删除 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenInstallDir}
              title="在系统资源管理器中打开当前修改器子目录"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-cyan-600" />
            </button>
            <button
              onClick={onDeleteClick}
              title="删除修改器及所有数据"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 下层：核心大动作操作栏 */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          {/* 一键启动修改器主按钮 */}
          <button
            onClick={onLaunchTrainer}
            disabled={isLaunching}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>{isLaunching ? "正在启动..." : "启动修改器"}</span>
          </button>

          {/* 一键双启 (游戏 + 修改器) */}
          {trainer.steam_app_id && (
            <button
              onClick={onLaunchDual}
              disabled={isLaunching}
              title="先启动 Steam 游戏，随后自动唤醒修改器"
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>一键双启</span>
            </button>
          )}

          {/* 仅启动 Steam 游戏 */}
          {trainer.steam_app_id && (
            <button
              onClick={onLaunchSteamOnly}
              title="直接唤醒 Steam 客户端启动该游戏"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-sky-600" />
              <span>运行游戏</span>
            </button>
          )}

          {/* 一键获取官方功能与封面数据 (当选项为空时突出呈现) */}
          {activeOptionCount === 0 && (
            <button
              onClick={onEnrichTrainer}
              disabled={isEnriching}
              title="联网匹配风灵月影官方所有功能开关、热键说明与官方海报"
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-cyan-200 ${isEnriching ? "animate-spin" : ""}`} />
              <span>{isEnriching ? "正在匹配数据..." : "获取修改器数据"}</span>
            </button>
          )}

          {/* 一键无感增量升级新版本按钮 */}
          {updateInfo?.has_update && (
            <button
              onClick={onUpdateTrainer}
              disabled={updatingId === trainer.id}
              title={`检测到官网最新版本 ${updateInfo.latest_version}，点击一键下载覆盖 exe，保留所有配置与开关预设`}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 animate-pulse"
            >
              <ArrowUpCircle className={`w-4 h-4 ${updatingId === trainer.id ? "animate-spin" : ""}`} />
              <span>
                {updatingId === trainer.id
                  ? "正在升级中..."
                  : `一键升级 (${updateInfo.latest_version})`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
