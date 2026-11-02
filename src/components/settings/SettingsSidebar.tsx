import React from "react";
import { Keyboard, FolderCog, Zap, Sparkles, Palette } from "lucide-react";
import { motion } from "motion/react";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export type SettingsTab = "appearance" | "hotkey" | "management" | "network" | "animation";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  activeIconColor: string;
  dotColor: string;
  tooltipText: string;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
  {
    id: "appearance",
    label: "外观与个性化",
    icon: Palette,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "定制启动器全局核心强调色、拾色器调色盘与个性化即时沙盒",
  },
  {
    id: "hotkey",
    label: "热键与自动化",
    icon: Keyboard,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "配置管理员 UAC 提权策略、按键延迟调度与全局预设备份",
  },
  {
    id: "management",
    label: "便携存储管理",
    icon: FolderCog,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "管理 trainers 根目录、无损跨盘搬家、开机自启与孤儿缓存清理",
  },
  {
    id: "network",
    label: "网络分流与加速",
    icon: Zap,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "配置 HTTP/SOCKS5 代理、GitHub 镜像节点与 Steam 封面 CDN",
  },
  {
    id: "animation",
    label: "界面与动效调节",
    icon: Sparkles,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "借鉴 PCL-CE 动效速度算法，定制全局动画倍率、纸片飘落与交互游乐场",
  },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="w-52 bg-white dark:bg-[#0f172a] border-r border-slate-200/90 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)] p-3 transition-colors duration-200">
      <div className="space-y-1 relative">
        {SETTINGS_TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TypewriterTooltip
              key={tab.id}
              text={tab.tooltipText}
              position="right"
              delayMs={350}
              className="block w-full"
            >
              <button
                onClick={() => onTabChange(tab.id)}
                className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200 text-left cursor-pointer group ${
                  isActive
                    ? "text-primary-text"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                }`}
              >
                {/* 活跃背景滑动药丸动画 (Mineradio 风格流畅胶囊动画) */}
                {isActive && (
                  <motion.div
                    layoutId="settings-sidebar-pill"
                    className="absolute inset-0 bg-primary-soft rounded-xl shadow-xs border border-primary-border z-0"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-2.5">
                  <JellyIcon intensity="gentle">
                    <IconComponent
                      className={`w-4 h-4 transition-colors ${
                        isActive ? tab.activeIconColor : tab.iconColor
                      }`}
                    />
                  </JellyIcon>
                  <span>{tab.label}</span>
                </div>

                {isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`relative z-10 w-1.5 h-1.5 rounded-full ${tab.dotColor}`}
                  />
                )}
              </button>
            </TypewriterTooltip>
          );
        })}
      </div>

      <div className="mt-auto p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
        <TypewriterTooltip
          text="设置项实时写入独立配置存储，重启客户端无缝还原喵~"
          position="top"
          delayMs={250}
        >
          <div className="space-y-1 cursor-help hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span>配置持久化</span>
              <span className="text-primary font-mono text-[10px] font-bold">
                app_config.json
              </span>
            </div>
            <p className="text-[10px] text-slate-400/80 dark:text-slate-500/80 leading-relaxed">
              修改即时自动落盘保存
            </p>
          </div>
        </TypewriterTooltip>
      </div>
    </aside>
  );
};