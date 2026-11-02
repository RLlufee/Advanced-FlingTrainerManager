import React from "react";
import { Keyboard, FolderCog, Zap, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export type SettingsTab = "hotkey" | "management" | "network" | "animation";

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeIconColor: string;
  dotColor: string;
  tooltipText: string;
}

const SETTINGS_TABS: SettingsTabConfig[] = [
  {
    id: "hotkey",
    label: "热键与自动化",
    icon: Keyboard,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
    tooltipText: "配置管理员 UAC 提权策略、按键延迟调度与全局预设备份",
  },
  {
    id: "management",
    label: "便携存储管理",
    icon: FolderCog,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
    tooltipText: "管理 trainers 根目录、无损跨盘搬家、开机自启与孤儿缓存清理",
  },
  {
    id: "network",
    label: "网络分流与加速",
    icon: Zap,
    iconColor: "text-slate-400 group-hover:text-amber-500",
    activeIconColor: "text-amber-400",
    dotColor: "bg-amber-400",
    tooltipText: "配置 HTTP/SOCKS5 代理、GitHub 镜像节点与 Steam 封面 CDN",
  },
  {
    id: "animation",
    label: "界面与动效调节",
    icon: Sparkles,
    iconColor: "text-slate-400 group-hover:text-purple-600",
    activeIconColor: "text-purple-400",
    dotColor: "bg-purple-400",
    tooltipText: "借鉴 PCL-CE 动效速度算法，定制全局动画倍率、纸片飘落与交互游乐场",
  },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="w-52 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)] p-3">
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
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {/* 活跃背景滑动药丸动画 (Mineradio 风格流畅胶囊动画) */}
                {isActive && (
                  <motion.div
                    layoutId="settings-sidebar-pill"
                    className="absolute inset-0 bg-slate-900 rounded-xl shadow-sm z-0"
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

      <div className="mt-auto p-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
        <TypewriterTooltip
          text="设置项实时写入独立配置存储，重启客户端无缝还原喵~"
          position="top"
          delayMs={250}
        >
          <div className="space-y-1 cursor-help hover:text-slate-600 transition-colors">
            <div className="flex items-center justify-between">
              <span>配置持久化</span>
              <span className="text-cyan-600 font-mono text-[10px] font-bold">
                app_config.json
              </span>
            </div>
            <p className="text-[10px] text-slate-400/80 leading-relaxed">
              修改即时自动落盘保存
            </p>
          </div>
        </TypewriterTooltip>
      </div>
    </aside>
  );
};