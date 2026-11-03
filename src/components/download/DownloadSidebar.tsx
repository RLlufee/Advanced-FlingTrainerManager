import React from "react";
import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import type { Trainer, InstalledTrainerRecord, DownloadProgressPayload } from "../../services/trainerApi";
import { GamePoster } from "../GamePoster";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export interface DownloadSidebarProps {
  trainers: Trainer[];
  loading: boolean;
  errorMsg: string | null;
  searchQuery: string;
  selectedId?: string | null;
  installedMap: Record<string, InstalledTrainerRecord>;
  downloads: Record<string, DownloadProgressPayload>;
  page: number;
  onSelectTrainer: (t: Trainer) => void;
  onPageChange: (newPage: number) => void;
}

export const DownloadSidebar: React.FC<DownloadSidebarProps> = ({
  trainers,
  loading,
  errorMsg,
  searchQuery,
  selectedId,
  installedMap,
  downloads,
  page,
  onSelectTrainer,
  onPageChange,
}) => {
  return (
    <div className="wallpaper-shell w-[360px] border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col shrink-0 select-none transition-colors duration-200">
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{searchQuery ? `搜索结果: "${searchQuery}"` : "官网最新修改器"}</span>
        <span>共 {trainers.length} 个条目</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && trainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-xs gap-2">
            <JellyIcon intensity="gentle">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            </JellyIcon>
            <span>正在从风灵月影官网同步数据...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-4 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 rounded-lg m-2 border border-rose-200/60 dark:border-rose-900/60">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4" />
              加载失败
            </div>
            {errorMsg}
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">
            未检索到匹配的修改器
          </div>
        ) : (
          trainers.map((t) => {
            const isSelected = selectedId === t.id;
            const isInst = Boolean(installedMap[t.id]);
            const dl = downloads[t.id];

            return (
              <div
                key={t.id}
                onClick={() => onSelectTrainer(t)}
                className={`relative p-2.5 rounded-xl border transition-colors cursor-pointer flex gap-3 group ${
                  isSelected
                    ? "border-primary-border shadow-xs text-slate-900 dark:text-slate-100"
                    : "bg-white dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                }`}
              >
                {/* 活跃项流体药丸滑动背景 */}
                {isSelected && (
                  <motion.div
                    layoutId="download-sidebar-pill"
                    className="absolute inset-0 bg-primary-soft rounded-xl shadow-xs border border-primary-border z-0"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                  />
                )}

                {/* 缩略图 */}
                <div className="relative z-10 w-16 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700/60 shadow-xs">
                  <GamePoster
                    primarySrc={t.capsule_image}
                    secondarySrc={
                      t.steam_app_id
                        ? `https://cdn.akamai.steamstatic.com/steam/apps/${t.steam_app_id}/header.jpg`
                        : null
                    }
                    tertiarySrc={t.thumbnail}
                    alt={t.chinese_name || t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    iconClassName="w-5 h-5"
                  />
                </div>

                {/* 信息 */}
                <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4
                        className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate leading-snug"
                        title={t.chinese_name || t.name}
                      >
                        {t.chinese_name || t.name}
                      </h4>
                      {isInst && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/60">
                          已安装
                        </span>
                      )}
                    </div>
                    {t.chinese_name && (
                      <p
                        className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5"
                        title={t.name}
                      >
                        {t.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {t.version && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                        {t.version}
                      </span>
                    )}
                    {t.game_version && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {t.game_version}
                      </span>
                    )}
                  </div>

                  {/* 下载进度条预览 */}
                  {dl && dl.status === "downloading" && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-200"
                        style={{ width: `${dl.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页控制器 */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
        <TypewriterTooltip text="翻回上一页修改器列表" position="top">
          <button
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <JellyIcon intensity="gentle">
              <ChevronLeft className="w-3.5 h-3.5" />
            </JellyIcon>
            <span>上一页</span>
          </button>
        </TypewriterTooltip>
        <span className="font-medium text-slate-500 dark:text-slate-400">第 {page} 页</span>
        <TypewriterTooltip text="探索下一页修改器" position="top">
          <button
            disabled={loading || trainers.length === 0}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <span>下一页</span>
            <JellyIcon intensity="gentle">
              <ChevronRight className="w-3.5 h-3.5" />
            </JellyIcon>
          </button>
        </TypewriterTooltip>
      </div>
    </div>
  );
};
