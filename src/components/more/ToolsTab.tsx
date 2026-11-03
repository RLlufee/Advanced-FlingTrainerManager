import React from "react";
import {
  Gamepad2,
  Monitor,
  Activity,
  Layers,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";

interface ToolsTabProps {
  onOpenTool: (
    tool: "dxdiag" | "joy.cpl" | "taskmgr" | "sysdm.cpl" | "temp",
    title: string
  ) => void;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({ onOpenTool }) => {
  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 百宝箱介绍卡片 */}
      <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5">
        <div className="flex items-center gap-3.5">
          <JellyIcon intensity="bouncy">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              游戏与系统诊断百宝箱
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              快速唤起 Windows 原生系统诊断与游戏控制器校准工具，免去在控制面板中繁琐翻找
            </p>
          </div>
        </div>
      </PaperCard>

      {/* 工具网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. DirectX 诊断工具 */}
        <PaperCard
          onClick={() => onOpenTool("dxdiag", "DirectX 诊断工具")}
          className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-500/50 transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="gentle">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
                <Monitor className="w-5 h-5" />
              </div>
            </JellyIcon>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 transition-colors">
              DirectX 诊断 (dxdiag)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              排查显卡驱动、声卡及 DirectX 3D 游戏硬件加速状态
            </p>
          </div>
        </PaperCard>

        {/* 2. 游戏手柄与控制器设置 */}
        <PaperCard
          onClick={() => onOpenTool("joy.cpl", "游戏控制器设置")}
          className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="gentle">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-5 h-5" />
              </div>
            </JellyIcon>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
              游戏控制器设置 (joy.cpl)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              Windows 原生手柄校准中心、摇杆死区与按键测试
            </p>
          </div>
        </PaperCard>

        {/* 3. 任务管理器 */}
        <PaperCard
          onClick={() => onOpenTool("taskmgr", "任务管理器")}
          className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="gentle">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </JellyIcon>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
              任务管理器 (Taskmgr)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              排查后台占用率极高的流氓进程、GPU 占用与游戏假死
            </p>
          </div>
        </PaperCard>

        {/* 4. 高级系统属性与虚拟内存设置 */}
        <PaperCard
          onClick={() => onOpenTool("sysdm.cpl", "高级系统设置")}
          className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/50 transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="gentle">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
            </JellyIcon>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
              高级系统设置 (sysdm.cpl)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              配置 Windows 虚拟内存分页大小、环境变量与视觉性能
            </p>
          </div>
        </PaperCard>

        {/* 5. 打开系统临时目录 */}
        <PaperCard
          onClick={() => onOpenTool("temp", "系统临时文件夹")}
          className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/50 transition-[border-color,box-shadow,background-color] duration-200 cursor-pointer group flex flex-col justify-between space-y-3"
        >
          <div className="flex items-start justify-between">
            <JellyIcon intensity="gentle">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <FolderOpen className="w-5 h-5" />
              </div>
            </JellyIcon>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
              打开系统临时目录 (%temp%)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              在文件资源管理器中打开 Windows 临时文件夹清理冗余缓存
            </p>
          </div>
        </PaperCard>
      </div>
    </PaperContainer>
  );
};
