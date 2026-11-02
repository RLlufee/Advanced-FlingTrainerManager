import React from "react";
import { Play, Download, Settings, LayoutGrid, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export type NavTab = "launch" | "download" | "settings" | "more";

interface TitleBarProps {
  title?: string;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = "Advanced FlingTrainer",
  activeTab,
  onTabChange,
}) => {
  const handleMinimize = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (err) {
      console.warn("Tauri window API not available in browser mode", err);
    }
  };

  const handleMaximize = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (err) {
      console.warn("Tauri window API not available in browser mode", err);
    }
  };

  const handleClose = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (err) {
      console.warn("Tauri window API not available in browser mode", err);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target === e.currentTarget ||
      target.getAttribute("data-tauri-drag-region") !== null
    ) {
      handleMaximize();
    }
  };

  const navItems: { key: NavTab; label: string; icon: React.ReactNode }[] = [
    { key: "launch", label: "启动", icon: <Play className="w-3.5 h-3.5 fill-current" /> },
    { key: "download", label: "下载", icon: <Download className="w-3.5 h-3.5" /> },
    { key: "settings", label: "设置", icon: <Settings className="w-3.5 h-3.5" /> },
    { key: "more", label: "更多", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  ];

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={handleDoubleClick}
      className="pcl-titlebar-bg h-12 w-full flex items-center justify-between px-4 select-none relative z-50 border-b border-slate-700/50 shadow-sm"
    >
      {/* 左侧：应用标题 */}
      <div data-tauri-drag-region className="flex items-center gap-2 min-w-[180px]">
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
        <span
          data-tauri-drag-region
          className="text-slate-100 text-sm font-semibold tracking-wide drop-shadow-sm font-sans"
        >
          {title}
        </span>
      </div>

      {/* 中间：居中胶囊导航栏（不添加拖拽属性，确保点击与悬停事件正常） */}
      <nav className="flex items-center justify-center p-1 bg-slate-900/60 backdrop-blur-md rounded-full border border-slate-600/40 shadow-inner">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={(e) => {
                e.stopPropagation();
                onTabChange(item.key);
              }}
              className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-md scale-100 font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 右侧：窗口控制按钮组 */}
      <div className="flex items-center gap-1 min-w-[120px] justify-end">
        <button
          onClick={handleMinimize}
          title="最小化"
          className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          title="最大化 / 还原"
          className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          title="关闭"
          className="w-8 h-8 flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-rose-600/90 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
