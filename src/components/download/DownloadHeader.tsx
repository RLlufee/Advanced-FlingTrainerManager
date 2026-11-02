import React from "react";
import { Search, RefreshCw } from "lucide-react";

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
    <div className="h-14 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-xs select-none">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            placeholder="搜索游戏修改器（支持中文或英文名，按 Enter 检索）..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-slate-800 transition-all"
          />
        </div>
        <button
          onClick={onSearchSubmit}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 active:scale-95"
        >
          搜索
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          title="刷新数据（强制从风灵月影官网重新拉取）"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
};
