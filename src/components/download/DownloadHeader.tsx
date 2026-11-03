import React from "react";
import { Search, RefreshCw, X } from "lucide-react";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export interface DownloadHeaderProps {
  searchQuery: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onRefresh: () => void;
}

export const DownloadHeader: React.FC<DownloadHeaderProps> = ({
  searchQuery,
  loading,
  onSearchChange,
  onSearchSubmit,
  onRefresh,
}) => {
  return (
    <div className="wallpaper-shell h-14 px-6 bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs select-none transition-colors duration-200">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            placeholder="搜索游戏修改器（支持中文或英文名，按 Enter 检索）..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                onRefresh();
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <TypewriterTooltip text="在风灵月影官网全库检索游戏修改器" position="top">
          <button
            onClick={onSearchSubmit}
            className="px-3.5 py-1.5 bg-primary bg-primary-hover text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shrink-0 active:scale-95 shadow-xs flex items-center gap-1.5"
          >
            <JellyIcon intensity="gentle">
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            </JellyIcon>
            <span>搜索</span>
          </button>
        </TypewriterTooltip>
      </div>

      <div className="flex items-center gap-2">
        <TypewriterTooltip text="从风灵月影官网强制拉取最新数据（跳过本地缓存）" position="left">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary-soft rounded-lg transition-all cursor-pointer"
          >
            <JellyIcon intensity="bouncy">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            </JellyIcon>
          </button>
        </TypewriterTooltip>
      </div>
    </div>
  );
};
