import React from "react";
import {
  Gamepad2,
  RefreshCw,
  Search,
  FolderTree,
  PlusCircle,
  X,
  Radio,
  FolderInput,
  Sparkles,
} from "lucide-react";
import type { InstalledTrainerRecord, TrainerUpdateInfo } from "../../services/trainerApi";
import { GamePoster } from "../GamePoster";

export interface LaunchSidebarProps {
  trainers: InstalledTrainerRecord[];
  filteredTrainers: InstalledTrainerRecord[];
  selectedId: string | null;
  searchQuery: string;
  updateMap: Record<string, TrainerUpdateInfo>;
  isImporting: boolean;
  isCheckingUpdate: boolean;
  isEnriching: boolean;
  isLoading: boolean;
  onSelectTrainer: (id: string) => void;
  onSearchQueryChange: (query: string) => void;
  onImportExternal: () => void;
  onCheckUpdates: () => void;
  onEnrichAll: () => void;
  onRefresh: () => void;
  onOpenTrainersRoot: () => void;
  onNavigateToDownload?: () => void;
}

export const LaunchSidebar: React.FC<LaunchSidebarProps> = ({
  trainers,
  filteredTrainers,
  selectedId,
  searchQuery,
  updateMap,
  isImporting,
  isCheckingUpdate,
  isEnriching,
  isLoading,
  onSelectTrainer,
  onSearchQueryChange,
  onImportExternal,
  onCheckUpdates,
  onEnrichAll,
  onRefresh,
  onOpenTrainersRoot,
  onNavigateToDownload,
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
      {/* 顶部搜索过滤与工具栏 */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="搜索已安装修改器..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            已安装 ({trainers.length})
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onImportExternal}
              disabled={isImporting}
              title="批量扫描并导入外部已有修改器（自动识别、提取、匹配 Steam 封面并建档）"
              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <FolderInput className={`w-3.5 h-3.5 ${isImporting ? "animate-bounce text-cyan-600" : ""}`} />
            </button>
            <button
              onClick={onCheckUpdates}
              disabled={isCheckingUpdate || trainers.length === 0}
              title="联网对比官网，检测是否有最新版本修改器"
              className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Radio className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-pulse text-amber-500" : ""}`} />
            </button>
            <button
              onClick={onEnrichAll}
              disabled={isEnriching || trainers.length === 0}
              title="一键联网补全所有缺少功能看板或封面的修改器数据"
              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? "animate-spin text-cyan-600" : ""}`} />
            </button>
            <button
              onClick={onRefresh}
              title="刷新已安装列表"
              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
            </button>
            <button
              onClick={onOpenTrainersRoot}
              title="打开 trainers 便携存储根目录"
              className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FolderTree className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 已安装修改器列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredTrainers.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-medium">
              {searchQuery ? "未匹配到相关修改器" : "暂未安装任何修改器"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {searchQuery ? "请更换搜索词重试" : "去下载页挑几个喜欢的游戏吧喵~"}
            </p>
          </div>
        ) : (
          filteredTrainers.map((t) => {
            const isSelected = t.id === selectedId;
            const displayName = t.chinese_name || t.name;
            const subName = t.chinese_name ? t.name : null;
            const optionCount = t.option_items?.length || t.options?.length || 0;
            const hasUpdate = updateMap[t.id]?.has_update;

            return (
              <button
                key={t.id}
                onClick={() => onSelectTrainer(t.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                  isSelected
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {/* 微缩海报 */}
                <div className="w-9 h-11 rounded-md overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 shadow-2xs">
                  <GamePoster
                    key={`${t.id}-${t.capsule_image || ""}-${t.thumbnail || ""}-${optionCount}`}
                    primarySrc={t.capsule_image}
                    secondarySrc={t.thumbnail}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    showInitials={false}
                  />
                </div>

                {/* 游戏名与版本徽章 */}
                <div className="truncate flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-slate-800 font-semibold text-xs leading-snug">
                      {displayName}
                    </span>
                    {hasUpdate && (
                      <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-2xs animate-pulse">
                        待更新
                      </span>
                    )}
                  </div>
                  {subName && (
                    <div className="truncate text-[10px] text-slate-400 font-normal">
                      {subName}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-normal">
                    <span className="text-cyan-600 font-medium">{t.version}</span>
                    {optionCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{optionCount} 项功能</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 边栏底部：导入与去下载 */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
        <button
          onClick={onImportExternal}
          disabled={isImporting}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <FolderInput className={`w-3.5 h-3.5 text-cyan-600 ${isImporting ? "animate-bounce" : ""}`} />
          <span>{isImporting ? "正在扫描纳管中..." : "批量导入已有修改器..."}</span>
        </button>
        {onNavigateToDownload && (
          <button
            onClick={onNavigateToDownload}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/60 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span>从官网下载更多修改器...</span>
          </button>
        )}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
          <span>便携独立存储架构</span>
          <span className="text-cyan-600/80 font-mono">trainers/</span>
        </div>
      </div>
    </aside>
  );
};
