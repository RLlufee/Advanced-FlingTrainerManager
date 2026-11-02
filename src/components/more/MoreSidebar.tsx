import React from "react";
import { Cpu, Wrench, Info, Boxes, Monitor, Sparkles } from "lucide-react";

export type MoreTab = "memory" | "hardware" | "cleanup" | "tools" | "about";

interface MoreSidebarProps {
  activeTab: MoreTab;
  onTabChange: (tab: MoreTab) => void;
}

export const MoreSidebar: React.FC<MoreSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="w-52 bg-white border-r border-slate-200/90 flex flex-col shrink-0 p-4 space-y-1.5 shadow-[2px_0_8px_rgba(0,0,0,0.02)] select-none">
      <div className="px-3 py-2 mb-1 flex items-center gap-2 text-slate-800 font-bold text-sm">
        <Boxes className="w-4 h-4 text-cyan-600" />
        <span>百宝箱中心</span>
      </div>

      {/* 1. 内存优化 */}
      <button
        onClick={() => onTabChange("memory")}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
          activeTab === "memory"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Cpu
            className={`w-4 h-4 ${
              activeTab === "memory"
                ? "text-cyan-400"
                : "text-slate-400 group-hover:text-cyan-600"
            }`}
          />
          <span>内存优化</span>
        </div>
        {activeTab === "memory" && (
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        )}
      </button>

      {/* 2. 硬件全景配置 */}
      <button
        onClick={() => onTabChange("hardware")}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
          activeTab === "hardware"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Monitor
            className={`w-4 h-4 ${
              activeTab === "hardware"
                ? "text-teal-400"
                : "text-slate-400 group-hover:text-teal-600"
            }`}
          />
          <span>硬件全景规格</span>
        </div>
        {activeTab === "hardware" && (
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
        )}
      </button>

      {/* 3. 系统与游戏清理 */}
      <button
        onClick={() => onTabChange("cleanup")}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
          activeTab === "cleanup"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles
            className={`w-4 h-4 ${
              activeTab === "cleanup"
                ? "text-emerald-400"
                : "text-slate-400 group-hover:text-emerald-600"
            }`}
          />
          <span>系统与游戏清理</span>
        </div>
        {activeTab === "cleanup" && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        )}
      </button>

      {/* 4. 实用百宝箱 */}
      <button
        onClick={() => onTabChange("tools")}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
          activeTab === "tools"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Wrench
            className={`w-4 h-4 ${
              activeTab === "tools"
                ? "text-indigo-400"
                : "text-slate-400 group-hover:text-indigo-600"
            }`}
          />
          <span>实用百宝箱</span>
        </div>
        {activeTab === "tools" && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
        )}
      </button>

      {/* 5. 系统与关于 */}
      <button
        onClick={() => onTabChange("about")}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
          activeTab === "about"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Info
            className={`w-4 h-4 ${
              activeTab === "about"
                ? "text-amber-400"
                : "text-slate-400 group-hover:text-amber-600"
            }`}
          />
          <span>系统与关于</span>
        </div>
        {activeTab === "about" && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        )}
      </button>

      <div className="flex-1" />

      {/* 边栏底部信息 */}
      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700">优化与清理引擎</span>
          <span className="text-cyan-600 font-mono text-[10px] font-bold">PCL2 & TK</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Windows NT 原生内核 / CIM 采集
        </p>
      </div>
    </aside>
  );
};
