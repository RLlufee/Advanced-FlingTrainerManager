import React, { useState } from "react";
import {
  Download,
  Play,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  ExternalLink,
  Gamepad2,
  Copy,
  Check,
  RefreshCw,
  Search,
} from "lucide-react";
import type { Trainer, DownloadProgressPayload } from "../../services/trainerApi";
import { trainerApi } from "../../services/trainerApi";
import { GamePoster } from "../GamePoster";
import { matchHotkey, translateHotkeyTitle } from "../../lib/hotkeyTranslate";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export interface TrainerDetailViewProps {
  selectedTrainer: Trainer | null;
  isInstalled: boolean;
  currentDownload?: DownloadProgressPayload;
  detailLoading: boolean;
  onSelectTrainer: (t: Trainer, forceRefresh?: boolean) => void;
  onDownload: (t: Trainer) => void;
  onLaunch: (id: string) => void;
}

export const TrainerDetailView: React.FC<TrainerDetailViewProps> = ({
  selectedTrainer,
  isInstalled,
  currentDownload,
  detailLoading,
  onSelectTrainer,
  onDownload,
  onLaunch,
}) => {
  const [hotkeyFilter, setHotkeyFilter] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) {
      return (bytesPerSec / (1024 * 1024)).toFixed(1) + " MB/s";
    }
    return (bytesPerSec / 1024).toFixed(0) + " KB/s";
  };

  if (!selectedTrainer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs gap-3 select-none">
        <JellyIcon intensity="gentle">
          <Download className="w-10 h-10 text-slate-300 dark:text-slate-600" />
        </JellyIcon>
        <span>请在左侧选择一个修改器查看功能与下载</span>
      </div>
    );
  }

  const hasHero = Boolean(selectedTrainer.hero_image);

  return (
    <div className="max-w-3xl space-y-6">
      {/* 头部大卡片 (支持 Steam 宽屏原画 Hero 沉浸式背景) */}
      <PaperCard
        delayIndex={0}
        tiltAngle={0.8}
        className="relative rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs bg-white dark:bg-[#131c31] text-slate-900 dark:text-slate-100 transition-all duration-300 overflow-hidden"
        style={
          hasHero
            ? {
                backgroundImage: `url(${selectedTrainer.hero_image})`,
                backgroundSize: "cover",
                backgroundPosition: "right center",
              }
            : undefined
        }
      >
        {/* 通透浅色毛玻璃与渐变遮罩 (在有 Hero 原画时通透呈现，右侧透光，左侧保持文字极致清晰与浅色风格统一) */}
        {hasHero && (
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/25 dark:from-[#131c31] dark:via-[#131c31]/90 dark:to-[#131c31]/30 backdrop-blur-[1.5px]" />
        )}

        <div className="relative z-10 flex gap-6 items-start">
          {/* 官方胶囊原画 / 封面 (多级平滑回退，防图裂) */}
          <div className="w-32 h-24 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-md">
            <GamePoster
              primarySrc={selectedTrainer.capsule_image}
              secondarySrc={
                selectedTrainer.steam_app_id
                  ? `https://cdn.akamai.steamstatic.com/steam/apps/${selectedTrainer.steam_app_id}/header.jpg`
                  : null
              }
              tertiarySrc={selectedTrainer.thumbnail}
              alt={selectedTrainer.chinese_name || selectedTrainer.name}
              className="w-full h-full object-cover"
              iconClassName="w-8 h-8"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {selectedTrainer.chinese_name || selectedTrainer.name}
              </h2>
              {isInstalled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已就绪
                </span>
              )}
              {selectedTrainer.steam_app_id && (
                <TypewriterTooltip text="在 Steam 商店中查看此游戏主页" position="bottom">
                  <button
                    onClick={() => trainerApi.openSteamStore(selectedTrainer.steam_app_id!)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <JellyIcon intensity="gentle">
                      <Gamepad2 className="w-3 h-3" />
                    </JellyIcon>
                    <span>Steam: {selectedTrainer.steam_app_id}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                  </button>
                </TypewriterTooltip>
              )}
            </div>

            {selectedTrainer.chinese_name && (
              <p className="text-xs mt-1 truncate text-slate-500 dark:text-slate-400">
                {selectedTrainer.name}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs mt-2.5">
              {selectedTrainer.version && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-primary-soft text-primary-text border border-primary-border">
                  <Layers className="w-3.5 h-3.5 opacity-70" />
                  {selectedTrainer.version}
                </span>
              )}
              {selectedTrainer.game_version && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
                  游戏版本: {selectedTrainer.game_version}
                </span>
              )}
              {selectedTrainer.last_update && (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  更新于 {selectedTrainer.last_update}
                </span>
              )}
              <TypewriterTooltip text="强制从风灵月影官网重新拉取最新功能与下载数据（跳过本地缓存）" position="bottom">
                <button
                  onClick={() => onSelectTrainer(selectedTrainer, true)}
                  disabled={detailLoading}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${detailLoading ? "animate-spin" : ""}`} />
                  <span>{detailLoading ? "刷新中..." : "重新抓取"}</span>
                </button>
              </TypewriterTooltip>
            </div>

            {/* 操作控制栏 */}
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              {isInstalled ? (
                <button
                  onClick={() => onLaunch(selectedTrainer.id)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <JellyIcon intensity="bouncy">
                    <Play className="w-4 h-4 fill-current" />
                  </JellyIcon>
                  <span>立即启动修改器</span>
                </button>
              ) : currentDownload?.status === "downloading" ? (
                <div className="flex-1 max-w-xs">
                  <div className="flex justify-between text-xs mb-1 text-slate-600 dark:text-slate-300 font-medium">
                    <span>正在极速下载... {currentDownload.progress.toFixed(0)}%</span>
                    <span>{formatSpeed(currentDownload.speed_bytes_per_sec)}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-300/60 dark:border-slate-700">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-200"
                      style={{ width: `${currentDownload.progress}%` }}
                    />
                  </div>
                </div>
              ) : currentDownload?.status === "extracting" ? (
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在自动解压并部署修改器组件...</span>
                </div>
              ) : (
                <button
                  onClick={() => onDownload(selectedTrainer)}
                  className="px-6 py-2.5 bg-primary bg-primary-hover text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <JellyIcon intensity="bouncy">
                    <Download className="w-4 h-4" />
                  </JellyIcon>
                  <span>一键下载并安装</span>
                </button>
              )}

              {/* 唤醒并启动 Steam 原版游戏按钮 */}
              {selectedTrainer.steam_app_id && (
                <TypewriterTooltip text="唤醒 Steam 客户端启动原版游戏本体" position="top">
                  <button
                    onClick={async () => {
                      try {
                        await trainerApi.launchSteamGame(selectedTrainer.steam_app_id!);
                      } catch (e) {
                        alert(String(e));
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    <JellyIcon intensity="bouncy">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </JellyIcon>
                    <span>启动 Steam 游戏</span>
                  </button>
                </TypewriterTooltip>
              )}

              {isInstalled && (
                <TypewriterTooltip text="重新覆盖下载此修改器安装包" position="top">
                  <button
                    onClick={() => onDownload(selectedTrainer)}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700"
                  >
                    重新下载
                  </button>
                </TypewriterTooltip>
              )}
            </div>
          </div>
        </div>
      </PaperCard>

      {/* 修改功能选项清单 (Options / Cheats) */}
      <PaperCard
        delayIndex={1}
        tiltAngle={1.0}
        className="bg-white dark:bg-[#131c31] rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">修改器功能与热键清单</h3>
            {selectedTrainer.options && selectedTrainer.options.length > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary-soft text-primary-text">
                {selectedTrainer.options.length} 项修改
              </span>
            )}
            {copyFeedback && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 animate-pulse border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3 h-3" />
                {copyFeedback}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 热键内联搜索过滤 */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              <input
                type="text"
                value={hotkeyFilter}
                onChange={(e) => setHotkeyFilter(e.target.value)}
                placeholder="过滤热键 (生命 / 金钱 / Num 1...)"
                className="pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-44 sm:w-52 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* 复制全部热键 */}
            <TypewriterTooltip text="复制所有热键至剪贴板（附带中文标注）" position="top">
              <button
                onClick={() => {
                  const items =
                    selectedTrainer.option_items && selectedTrainer.option_items.length > 0
                      ? selectedTrainer.option_items
                          .map((i) => {
                            const tag = translateHotkeyTitle(i.title);
                            const tagStr = tag ? ` [${tag}]` : "";
                            return i.note
                              ? `${i.title}${tagStr} (${i.note})`
                              : `${i.title}${tagStr}`;
                          })
                          .join("\n")
                      : (selectedTrainer.options || [])
                          .map((opt) => {
                            const tag = translateHotkeyTitle(opt);
                            return tag ? `${opt} [${tag}]` : opt;
                          })
                          .join("\n");
                  navigator.clipboard.writeText(items);
                  setCopyFeedback("全部热键（含中文标注）已复制");
                  setTimeout(() => setCopyFeedback(null), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <JellyIcon intensity="gentle">
                  <Copy className="w-3 h-3" />
                </JellyIcon>
                <span>复制全部</span>
              </button>
            </TypewriterTooltip>

            {detailLoading && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
              </span>
            )}
          </div>
        </div>

        {(() => {
          const filteredItems = (selectedTrainer.option_items || []).filter((item) =>
            matchHotkey(item.title, item.note, hotkeyFilter)
          );
          const filteredPlain = (selectedTrainer.options || []).filter((opt) =>
            matchHotkey(opt, null, hotkeyFilter)
          );

          return (
            <PaperContainer className="mt-4">
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredItems.map((item, idx) => {
                    const cnTag = translateHotkeyTitle(item.title);
                    return (
                      <PaperCard
                        key={idx}
                        delayIndex={idx}
                        tiltAngle={1.2}
                        onClick={() => {
                          const copyText = cnTag ? `${item.title} [${cnTag}]` : item.title;
                          navigator.clipboard.writeText(copyText);
                          setCopyFeedback(`已复制: ${copyText}`);
                          setTimeout(() => setCopyFeedback(null), 1500);
                        }}
                        title="点击复制此项热键与中文说明"
                        className="group flex flex-col p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-850 hover:border-primary transition-all gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-wrap flex-1">
                            <div className="w-2 h-2 rounded-full bg-primary shadow-xs shrink-0 mt-1" />
                            <span className="text-xs text-slate-800 dark:text-slate-200 font-semibold font-mono tracking-tight break-words">
                              {item.title}
                            </span>
                            {cnTag && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-soft text-primary-text border border-primary-border shrink-0">
                                {cnTag}
                              </span>
                            )}
                          </div>
                          <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                        </div>
                        {item.note && (
                          <div className="pl-4 text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/60 rounded-lg p-1.5 leading-relaxed font-sans">
                            <span className="font-medium text-primary mr-1">ℹ️ 生效说明:</span>
                            {item.note}
                          </div>
                        )}
                      </PaperCard>
                    );
                  })}
                </div>
              ) : filteredPlain.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredPlain.map((opt, idx) => {
                    const cnTag = translateHotkeyTitle(opt);
                    return (
                      <PaperCard
                        key={idx}
                        delayIndex={idx}
                        tiltAngle={1.2}
                        onClick={() => {
                          const copyText = cnTag ? `${opt} [${cnTag}]` : opt;
                          navigator.clipboard.writeText(copyText);
                          setCopyFeedback(`已复制: ${copyText}`);
                          setTimeout(() => setCopyFeedback(null), 1500);
                        }}
                        title="点击复制此项热键"
                        className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-850 hover:border-primary transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap flex-1">
                          <div className="w-2 h-2 rounded-full bg-primary shadow-xs shrink-0" />
                          <span className="text-xs text-slate-700 dark:text-slate-200 font-medium font-mono">
                            {opt}
                          </span>
                          {cnTag && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-soft text-primary-text border border-primary-border shrink-0">
                              {cnTag}
                            </span>
                          )}
                        </div>
                        <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </PaperCard>
                    );
                  })}
                </div>
              ) : hotkeyFilter.trim() ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  未搜索到匹配 “{hotkeyFilter}” 的修改项
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-mono border border-slate-200/60 dark:border-slate-800">
                  {selectedTrainer.description || "正在从风灵月影官网拉取完整说明..."}
                </div>
              )}
            </PaperContainer>
          );
        })()}
      </PaperCard>
    </div>
  );
};
