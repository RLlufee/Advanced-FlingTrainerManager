import React, { useState } from "react";
import {
  Cpu,
  Zap,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Sliders,
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import {
  SystemMemoryInfo,
  MemoryOptimizeOptions,
  MemoryOptimizeResult,
} from "../../services/memoryApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

interface MemoryTabProps {
  memInfo: SystemMemoryInfo | null;
  isLoading: boolean;
  isOptimizing: boolean;
  options: MemoryOptimizeOptions;
  onOptionsChange: (opts: MemoryOptimizeOptions) => void;
  lastResult: MemoryOptimizeResult | null;
  onRefresh: (showToast?: boolean) => void;
  onOptimize: () => void;
  onRestartAdmin: () => void;
  formatBytes: (bytes: number) => string;
}

export const MemoryTab: React.FC<MemoryTabProps> = ({
  memInfo,
  isLoading,
  isOptimizing,
  options,
  onOptionsChange,
  lastResult,
  onRefresh,
  onOptimize,
  onRestartAdmin,
  formatBytes,
}) => {
  const [showOptions, setShowOptions] = useState<boolean>(true);
  const percent = memInfo ? Math.round(memInfo.used_percent) : 0;

  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 顶部横幅卡片：介绍与权限状态 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <JellyIcon intensity="bouncy">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
            </JellyIcon>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                系统物理内存深度优化调度引擎
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700">
                  Rust 内核版
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                运用 PCL2 CE 同款 Windows NT 内核指令，直接清理物理工作集与备用缓存（Standby List），大幅释放可用内存
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TypewriterTooltip text="重新读取当前系统物理内存与虚拟分页实时状态" position="left">
              <button
                onClick={() => onRefresh(true)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <JellyIcon intensity="gentle">
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
                </JellyIcon>
                <span>刷新</span>
              </button>
            </TypewriterTooltip>
          </div>
        </div>

        {/* 权限状态栏 */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs">
            {memInfo?.is_admin ? (
              <>
                <JellyIcon intensity="gentle">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </JellyIcon>
                <span className="font-semibold text-emerald-800">
                  管理员特权模式
                </span>
                <span className="text-slate-500">
                  — 已成功获取内核特权，待机缓存列表与系统文件缓存完全解锁
                </span>
              </>
            ) : (
              <>
                <JellyIcon intensity="gentle">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                </JellyIcon>
                <span className="font-semibold text-amber-800">
                  普通权限模式
                </span>
                <span className="text-slate-500">
                  — 支持全进程工作集回收；如需深度清空待机缓存，请提权重启
                </span>
              </>
            )}
          </div>

          {!memInfo?.is_admin && (
            <TypewriterTooltip text="通过 UAC 提权重新唤醒客户端以解锁 Windows NT 内核全部清退指令" position="left">
              <button
                onClick={onRestartAdmin}
                className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <JellyIcon intensity="bouncy">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                </JellyIcon>
                <span>以管理员重启</span>
              </button>
            </TypewriterTooltip>
          )}
        </div>
      </PaperCard>

      {/* 仪表盘核心卡片：内存占用与一键优化 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* 1. 动态 SVG 圆环占用率 */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-200"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`transition-all duration-700 ease-out ${
                    percent < 65
                      ? "stroke-emerald-500"
                      : percent < 85
                      ? "stroke-cyan-500"
                      : "stroke-rose-500"
                  }`}
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * percent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                  {percent}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                  物理内存占用
                </span>
              </div>
            </div>

            <div className="w-full mt-3 px-2">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>负载状态</span>
                <span
                  className={`font-semibold ${
                    percent < 60
                      ? "text-emerald-600"
                      : percent < 82
                      ? "text-cyan-600"
                      : "text-rose-600"
                  }`}
                >
                  {percent < 60 ? "空闲舒适" : percent < 82 ? "正常负载" : "内存紧张"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    percent < 60
                      ? "bg-emerald-500"
                      : percent < 82
                      ? "bg-cyan-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. 内存明细看板 */}
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs text-slate-600">当前已用物理内存</span>
              </div>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {memInfo ? formatBytes(memInfo.used_phys_bytes) : "--"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600">当前可用空闲内存</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {memInfo ? formatBytes(memInfo.avail_phys_bytes) : "--"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-xs text-slate-600">安装物理内存总计</span>
              </div>
              <span className="text-xs font-bold text-slate-700 font-mono">
                {memInfo ? formatBytes(memInfo.total_phys_bytes) : "--"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-xs text-slate-600">系统分页虚拟文件</span>
              </div>
              <span className="text-xs font-bold text-indigo-700 font-mono">
                {memInfo ? formatBytes(memInfo.avail_pagefile_bytes) : "--"} 可用 /{" "}
                {memInfo ? formatBytes(memInfo.total_pagefile_bytes) : "--"}
              </span>
            </div>
          </div>

          {/* 3. 一键优化主操作区 */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
            <TypewriterTooltip text="执行 NT 内核原生内存修剪与缓存回收" position="top">
              <button
                onClick={onOptimize}
                disabled={isOptimizing}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-900/10 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                    <span>正在进行内核级深层优化……</span>
                  </>
                ) : (
                  <>
                    <JellyIcon intensity="bouncy">
                      <Zap className="w-4 h-4 text-amber-300 fill-current group-hover:scale-110 transition-transform" />
                    </JellyIcon>
                    <span>⚡ 一键深度优化物理内存</span>
                  </>
                )}
              </button>
            </TypewriterTooltip>

            <p className="text-[11px] text-slate-400 leading-relaxed text-center px-2">
              💡 非普通 GC 伪释放，直接调度 NT 内核清退待机缓存与多余工作集。
            </p>

            {lastResult && (
              <div className="w-full p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
                <span className="font-semibold">优化战报:</span>
                <span className="font-mono font-bold text-emerald-700">
                  +{formatBytes(lastResult.freed_bytes)} 释放
                </span>
              </div>
            )}
          </div>
        </div>
      </PaperCard>

      {/* 高级细粒度系统调用配置卡片 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <JellyIcon intensity="gentle">
              <Sliders className="w-4 h-4 text-cyan-600" />
            </JellyIcon>
            <span className="font-bold text-slate-900 text-sm">
              高级内存清理项目细粒度配置 (7 大系统级动作)
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <span>{showOptions ? "收起参数" : "展开高级参数"}</span>
            {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showOptions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
            {/* 1 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-800">
                  清空进程工作集 (Empty Working Sets)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  强制回收全系统空闲后台进程占用的物理工作集
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOptionsChange({
                    ...options,
                    empty_working_sets: !options.empty_working_sets,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.empty_working_sets ? "bg-cyan-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    options.empty_working_sets ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 2 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-800">
                  清空待机内存列表 (Purge Standby List)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  将 Windows 占用的超大备用缓存瞬间转化为可用内存（核心）
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOptionsChange({
                    ...options,
                    purge_standby_list: !options.purge_standby_list,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.purge_standby_list ? "bg-cyan-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    options.purge_standby_list ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-800">
                  刷新系统文件缓存 (Flush File Cache)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  重置大文件拷贝与游戏解压留存的系统文件缓存映射
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOptionsChange({
                    ...options,
                    flush_file_cache: !options.flush_file_cache,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.flush_file_cache ? "bg-cyan-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    options.flush_file_cache ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 4 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-800">
                  刷写修改页列表 (Flush Modified List)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  将已修改尚未落盘的页面刷写到系统分页存储中
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOptionsChange({
                    ...options,
                    flush_modified_list: !options.flush_modified_list,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.flush_modified_list ? "bg-cyan-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    options.flush_modified_list ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 5 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-800">
                  物理内存页去重合并 (Combine Memory)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  扫描重复内容的物理页并进行透明压缩引用合并
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOptionsChange({
                    ...options,
                    combine_physical_memory: !options.combine_physical_memory,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.combine_physical_memory ? "bg-cyan-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    options.combine_physical_memory ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 6 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="pr-3">
                <div className="text-xs font-bold text-slate-800">
                  注册表协调释放 (Registry Reconcile)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  向 Windows 注册表管理器发出内存回收协调调用
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOptionsChange({
                    ...options,
                    registry_reconciliation: !options.registry_reconciliation,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  options.registry_reconciliation ? "bg-cyan-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    options.registry_reconciliation ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </PaperCard>

      {/* 执行战报与审计日志 */}
      {lastResult && lastResult.logs.length > 0 && (
        <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
            <JellyIcon intensity="gentle">
              <Terminal className="w-4 h-4 text-cyan-600" />
            </JellyIcon>
            <span>本次内核调用执行日志</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 shadow-inner max-h-36 overflow-y-auto custom-scrollbar">
            {lastResult.logs.map((log, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-cyan-400">❯</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </PaperCard>
      )}
    </PaperContainer>
  );
};
