import React from "react";
import { Keyboard, FolderCog, Zap } from "lucide-react";

export type SettingsTab = "hotkey" | "management" | "network";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="w-48 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none shadow-2xs">
      <div className="p-3 space-y-1">
        {/* 1. 热键 */}
        <button
          onClick={() => onTabChange("hotkey")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
            activeTab === "hotkey"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Keyboard
              className={`w-4 h-4 ${
                activeTab === "hotkey"
                  ? "text-cyan-400"
                  : "text-slate-400 group-hover:text-cyan-600"
              }`}
            />
            <span>热键</span>
          </div>
          {activeTab === "hotkey" && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          )}
        </button>

        {/* 2. 管理 */}
        <button
          onClick={() => onTabChange("management")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
            activeTab === "management"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FolderCog
              className={`w-4 h-4 ${
                activeTab === "management"
                  ? "text-cyan-400"
                  : "text-slate-400 group-hover:text-cyan-600"
              }`}
            />
            <span>管理</span>
          </div>
          {activeTab === "management" && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          )}
        </button>

        {/* 3. 网络与加速 */}
        <button
          onClick={() => onTabChange("network")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
            activeTab === "network"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Zap
              className={`w-4 h-4 ${
                activeTab === "network"
                  ? "text-amber-400"
                  : "text-slate-400 group-hover:text-amber-500"
              }`}
            />
            <span>网络与加速</span>
          </div>
          {activeTab === "network" && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      <div className="mt-auto p-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>配置持久化</span>
          <span className="text-cyan-600 font-mono text-[10px]">app_config.json</span>
        </div>
        <p className="text-[10px] text-slate-400/80 leading-relaxed">
          修改即时自动落盘保存
        </p>
      </div>
    </aside>
  );
};
