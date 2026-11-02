import React from "react";
import { Sparkles, Boxes } from "lucide-react";
import { SystemMemoryInfo } from "../../services/memoryApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";

interface AboutTabProps {
  memInfo: SystemMemoryInfo | null;
}

export const AboutTab: React.FC<AboutTabProps> = ({ memInfo }) => {
  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 系统环境看板 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <JellyIcon intensity="bouncy">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              系统运行环境与内核状态
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              当前桌面端客户端底层技术栈与系统特权诊断
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <span className="text-slate-500">操作系统内核架构</span>
            <span className="font-semibold text-slate-800 font-mono">Windows x64 (NT Kernel)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <span className="text-slate-500">应用框架运行库</span>
            <span className="font-semibold text-slate-800 font-mono">Tauri v2 + Rust 2024</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <span className="text-slate-500">前端视图渲染架构</span>
            <span className="font-semibold text-slate-800 font-mono">React 19 + TypeScript + Vite</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <span className="text-slate-500">当前进程特权等级</span>
            <span
              className={`font-semibold font-mono ${
                memInfo?.is_admin ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {memInfo?.is_admin ? "Administrator (已提权)" : "Standard User (普通用户)"}
            </span>
          </div>
        </div>
      </PaperCard>

      {/* 致敬开源社区 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <JellyIcon intensity="gentle">
            <Boxes className="w-4 h-4 text-cyan-600" />
          </JellyIcon>
          <span>致敬与开源技术鸣谢</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          本管理器的物理内存深度优化功能深入借鉴了{" "}
          <span className="font-semibold text-slate-800">
            Plain Craft Launcher 2 (PCL2)
          </span>{" "}
          及其社区维护版（<span className="font-semibold text-slate-800">PCL-CE</span>）中{" "}
          <code className="text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded font-mono text-[11px]">
            MemSwapWorks
          </code>{" "}
          的内核设计思想，并完全采用 Rust 原生重构 Windows NT 底层系统调用，实现无托管垃圾回收开销的高性能内存优化。
        </p>
        <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
          系统深层垃圾清理与硬件全景规格检测模块参考了开源桌面工具箱{" "}
          <span className="font-semibold text-slate-800">
            ToolKnit Desktop
          </span>{" "}
          的 Windows 原生只读检测与安全分级清理设计，针对游戏玩家场景深度定制了 DirectX / NVIDIA / AMD 显卡着色器缓存与游戏崩溃日志的高效瘦身方案。
        </p>
      </PaperCard>
    </PaperContainer>
  );
};