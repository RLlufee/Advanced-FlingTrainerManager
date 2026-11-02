import React from "react";
import { Play, Download, Settings, LayoutGrid, Minus, Square, X, Sun, Moon, Monitor } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MagneticTab, JellyIcon, TypewriterTooltip } from "./ui/motion";
import { useTheme } from "./ui/theme";

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
  const { currentAccent, colorMode, isDark, toggleColorMode } = useTheme();

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
      className="pcl-titlebar-bg h-12 w-full flex items-center justify-between px-4 select-none relative z-50 border-b border-white/15 shadow-sm"
    >
      {/* 左侧：应用标题（集成打字机 Tooltip 提示） */}
      <div data-tauri-drag-region className="flex items-center gap-2 min-w-[180px]">
        <TypewriterTooltip content="PCL II 灵动视觉内核 · 已就绪喵~">
          <div className="flex items-center gap-2 cursor-pointer">
            <JellyIcon intensity="bouncy">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse transition-all duration-300"
                style={{
                  backgroundColor: currentAccent.primary,
                  boxShadow: `0 0 10px ${currentAccent.primary}`,
                }}
              />
            </JellyIcon>
            <span
              data-tauri-drag-region
              className="text-slate-100 text-sm font-semibold tracking-wide drop-shadow-sm font-sans"
            >
              {title}
            </span>
          </div>
        </TypewriterTooltip>
      </div>

      {/* 中间：居中磁吸胶囊导航栏（交互式磁吸吸引 + 液体平滑滑块） */}
      <nav className="flex items-center justify-center p-1 bg-black/25 backdrop-blur-md rounded-full border border-white/20 shadow-inner">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <MagneticTab
              key={item.key}
              isActive={isActive}
              onClick={() => onTabChange(item.key)}
              layoutId="titlebar-capsule-pill"
              activePillClassName="bg-white shadow-md shadow-primary-glow"
              activeTextClassName="text-primary-text"
            >
              <JellyIcon intensity="medium">{item.icon}</JellyIcon>
              <span>{item.label}</span>
            </MagneticTab>
          );
        })}
      </nav>

      {/* 右侧：窗口控制按钮组（Q 弹果冻微动效） */}
      <div className="flex items-center gap-1 min-w-[140px] justify-end">
        {/* 深浅色彩模式快速切换按钮 */}
        <TypewriterTooltip
          content={
            colorMode === "system"
              ? `当前色彩：跟随系统 (${isDark ? "深色" : "浅色"}) · 点击切换`
              : colorMode === "dark"
              ? "当前色彩：极客深色 · 点击切换"
              : "当前色彩：明亮浅色 · 点击切换"
          }
          position="bottom"
        >
          <JellyIcon intensity="gentle">
            <button
              onClick={toggleColorMode}
              className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer mr-1 relative"
              title="切换界面深浅色彩模式"
            >
              {colorMode === "system" ? (
                <Monitor className="w-3.5 h-3.5 text-white/90" />
              ) : isDark ? (
                <Moon className="w-3.5 h-3.5 text-indigo-200" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              )}
              {colorMode === "system" && (
                <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />
              )}
            </button>
          </JellyIcon>
        </TypewriterTooltip>

        <JellyIcon intensity="gentle">
          <button
            onClick={handleMinimize}
            title="最小化"
            className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </JellyIcon>

        <JellyIcon intensity="gentle">
          <button
            onClick={handleMaximize}
            title="最大化 / 还原"
            className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <Square className="w-3 h-3" />
          </button>
        </JellyIcon>

        <TypewriterTooltip content="关闭当前客户端窗口" position="left">
          <JellyIcon intensity="bouncy">
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-rose-600/90 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </JellyIcon>
        </TypewriterTooltip>
      </div>
    </header>
  );
};
