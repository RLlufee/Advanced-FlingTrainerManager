import React from "react";
import { Cpu, Wrench, Info, Boxes, Monitor, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export type MoreTab = "memory" | "hardware" | "cleanup" | "tools" | "about";

interface MoreSidebarProps {
  activeTab: MoreTab;
  onTabChange: (tab: MoreTab) => void;
}

interface TabItemConfig {
  id: MoreTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeIconColor: string;
  dotColor: string;
  tooltipText: string;
}

const TABS: TabItemConfig[] = [
  {
    id: "memory",
    label: "内存优化",
    icon: Cpu,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "释放进程工作集与系统备用缓存",
  },
  {
    id: "hardware",
    label: "硬件信息",
    icon: Monitor,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "查看 CPU、显卡、内存、主板与磁盘",
  },
  {
    id: "cleanup",
    label: "磁盘清理",
    icon: Sparkles,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "清理着色器缓存与临时文件",
  },
  {
    id: "tools",
    label: "系统工具",
    icon: Wrench,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "快速打开 Windows 诊断、手柄校准等工具",
  },
  {
    id: "about",
    label: "系统与关于",
    icon: Info,
    iconColor: "text-slate-400 group-hover:text-cyan-600",
    activeIconColor: "text-cyan-600",
    dotColor: "bg-cyan-500",
    tooltipText: "查看 Tauri v2 原生环境技术栈与开源致敬信息",
  },
];

export const MoreSidebar: React.FC<MoreSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="wallpaper-shell w-56 bg-white dark:bg-[#0f172a] border-r border-slate-200/90 dark:border-slate-800 flex flex-col shrink-0 p-4 space-y-1.5 shadow-[2px_0_8px_rgba(0,0,0,0.02)] select-none transition-colors duration-200">
      <div className="px-3 py-2 mb-1 flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
        <JellyIcon intensity="medium">
          <Boxes className="w-4 h-4 text-primary" />
        </JellyIcon>
        <span>工具箱</span>
      </div>

      <div className="space-y-1 relative">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TypewriterTooltip
              key={tab.id}
              text={tab.tooltipText}
              position="right"
              delayMs={400}
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
                    layoutId="more-sidebar-pill"
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

    </aside>
  );
};
