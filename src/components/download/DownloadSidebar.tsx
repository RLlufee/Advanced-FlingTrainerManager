import React from "react";
import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import type { Trainer, InstalledTrainerRecord, DownloadProgressPayload } from "../../services/trainerApi";
import { GamePoster } from "../GamePoster";

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
    <div className="w-[360px] border-r border-slate-200/80 bg-white flex flex-col shrink-0 select-none">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{searchQuery ? `搜索结果: "${searchQuery}"` : "官网最新修改器"}</span>
        <span>共 {trainers.length} 个条目</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading && trainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span>正在从风灵月影官网同步数据...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-4 text-xs text-rose-600 bg-rose-50 rounded-lg m-2">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-4 h-4" />
              加载失败
            </div>
            {errorMsg}
          </div>
        ) : trainers.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
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
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                  isSelected
                    ? "bg-primary-soft border-primary-border shadow-xs"
                    : "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70"
                }`}
              >
                {/* 缩略图 */}
                <div className="w-16 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200/50 shadow-xs">
                  <GamePoster
                    primarySrc={t.capsule_image}
                    secondarySrc={
                      t.steam_app_id
                        ? `https://cdn.akamai.steamstatic.com/steam/apps/${t.steam_app_id}/header.jpg`
                        : null
                    }
                    tertiarySrc={t.thumbnail}
                    alt={t.chinese_name || t.name}
                    className="w-full h-full object-cover"
                    iconClassName="w-5 h-5"
                  />
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4
                        className="text-xs font-semibold text-slate-800 truncate leading-snug"
                        title={t.chinese_name || t.name}
                      >
                        {t.chinese_name || t.name}
                      </h4>
                      {isInst && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          已安装
                        </span>
                      )}
                    </div>
                    {t.chinese_name && (
                      <p
                        className="text-[10px] text-slate-400 truncate leading-tight mt-0.5"
                        title={t.name}
                      >
                        {t.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    {t.version && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[110px]">
                        {t.version}
                      </span>
                    )}
                    {t.game_version && (
                      <span className="text-[10px] text-slate-400 truncate">
                        {t.game_version}
                      </span>
                    )}
                  </div>

                  {/* 下载进度条预览 */}
                  {dl && dl.status === "downloading" && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
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
      <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
        <button
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>上一页</span>
        </button>
        <span className="font-medium text-slate-500">第 {page} 页</span>
        <button
          disabled={loading || trainers.length === 0}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>下一页</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
