import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Sparkles,
  Gamepad2,
  Activity,
  Layers,
  Sliders,
  FolderOpen,
  Monitor,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Check,
  AlertTriangle,
  Wrench,
  Boxes,
} from "lucide-react";
import {
  getSystemMemoryInfo,
  optimizeMemory,
  restartAppAsAdmin,
  openSystemTool,
  SystemMemoryInfo,
  MemoryOptimizeOptions,
  MemoryOptimizeResult,
} from "../services/memoryApi";

export type MoreTab = "memory" | "tools" | "about";

interface MoreViewProps {
  isActive?: boolean;
}

export const MoreView: React.FC<MoreViewProps> = ({ isActive = true }) => {
  const [activeTab, setActiveTab] = useState<MoreTab>("memory");
  const [memInfo, setMemInfo] = useState<SystemMemoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(true);
  const [lastResult, setLastResult] = useState<MemoryOptimizeResult | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // 优化参数定制
  const [options, setOptions] = useState<MemoryOptimizeOptions>({
    empty_working_sets: true,
    purge_standby_list: true,
    flush_file_cache: true,
    flush_modified_list: true,
    purge_low_priority_standby: true,
    combine_physical_memory: true,
    registry_reconciliation: true,
  });

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // 获取内存信息
  const fetchMemory = async (showRefreshToast = false) => {
    try {
      setIsLoading(true);
      const info = await getSystemMemoryInfo();
      setMemInfo(info);
      if (showRefreshToast) {
        showToast("info", "系统内存状态已刷新");
      }
    } catch (e: any) {
      showToast("error", `获取内存信息失败: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      fetchMemory();
      const interval = setInterval(() => {
        getSystemMemoryInfo().then(setMemInfo).catch(() => {});
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // 执行内存深度优化
  const handleOptimize = async () => {
    if (isOptimizing) return;
    try {
      setIsOptimizing(true);
      const res = await optimizeMemory(options);
      setLastResult(res);
      setMemInfo(res.after);
      if (res.freed_bytes > 0) {
        showToast(
          "success",
          `内存深度优化完成！释放了 ${formatBytes(res.freed_bytes)} 内存`
        );
      } else {
        showToast("info", "当前内存已处于极佳状态，各缓存列表已完成整理");
      }
    } catch (e: any) {
      showToast("error", `内存优化失败: ${e}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 提升权限重启
  const handleRestartAdmin = async () => {
    try {
      showToast("info", "正在请求 Windows UAC 管理员提权重启...");
      await restartAppAsAdmin();
    } catch (e: any) {
      showToast("error", `提权重启失败: ${e}`);
    }
  };

  // 快捷打开系统工具
  const handleOpenTool = async (
    tool: "dxdiag" | "joy.cpl" | "taskmgr" | "sysdm.cpl" | "temp",
    title: string
  ) => {
    try {
      await openSystemTool(tool);
      showToast("success", `已唤起 ${title}`);
    } catch (e: any) {
      showToast("error", `呼起 ${title} 失败: ${e}`);
    }
  };

  // 计算百分比
  const percent = memInfo ? Math.round(memInfo.used_percent) : 0;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#edf0f5] select-none font-sans">
      {/* 浮动 Toast 提示 */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-500/90 text-white border-emerald-400/50 shadow-emerald-500/20"
              : toast.type === "error"
              ? "bg-rose-500/90 text-white border-rose-400/50 shadow-rose-500/20"
              : "bg-slate-800/90 text-white border-slate-700/50 shadow-slate-900/30"
          }`}
        >
          {toast.type === "success" && <Check className="w-4 h-4 stroke-[2.5]" />}
          {toast.type === "error" && <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
          {toast.type === "info" && <Sparkles className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 左侧白色拟物侧边栏 (PCL II 风格边栏) */}
      <aside className="w-52 bg-white border-r border-slate-200/90 flex flex-col shrink-0 p-4 space-y-1.5 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        <div className="px-3 py-2 mb-1 flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Boxes className="w-4 h-4 text-cyan-600" />
          <span>百宝箱中心</span>
        </div>

        {/* 1. 内存优化 */}
        <button
          onClick={() => setActiveTab("memory")}
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

        {/* 2. 实用百宝箱 */}
        <button
          onClick={() => setActiveTab("tools")}
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

        {/* 3. 系统与关于 */}
        <button
          onClick={() => setActiveTab("about")}
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
            <span className="font-medium text-slate-700">算法核心</span>
            <span className="text-cyan-600 font-mono text-[10px] font-bold">PCL2 CE NT</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Windows NT 内核原生调用
          </p>
        </div>
      </aside>

      {/* 右侧卡片式工作区 */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* ======================= TAB 1: 内存优化 ======================= */}
        {activeTab === "memory" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-150">
            {/* 顶部横幅卡片：介绍与权限状态 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
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
                  <button
                    onClick={() => fetchMemory(true)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
                    <span>刷新</span>
                  </button>
                </div>
              </div>

              {/* 权限状态栏 */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs">
                  {memInfo?.is_admin ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-800">
                        管理员特权模式
                      </span>
                      <span className="text-slate-500">
                        — 已成功获取内核特权，待机缓存列表与系统文件缓存完全解锁
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
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
                  <button
                    onClick={handleRestartAdmin}
                    className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                    <span>以管理员重启</span>
                  </button>
                )}
              </div>
            </div>

            {/* 仪表盘核心卡片：内存占用与一键优化 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
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
                  <button
                    onClick={handleOptimize}
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
                        <Zap className="w-4 h-4 text-amber-300 fill-current group-hover:scale-110 transition-transform" />
                        <span>⚡ 一键深度优化物理内存</span>
                      </>
                    )}
                  </button>

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
            </div>

            {/* 高级细粒度系统调用配置卡片 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center justify-between w-full text-xs text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-600" />
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
                      onClick={() => setOptions({ ...options, empty_working_sets: !options.empty_working_sets })}
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
                      onClick={() => setOptions({ ...options, purge_standby_list: !options.purge_standby_list })}
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
                      onClick={() => setOptions({ ...options, flush_file_cache: !options.flush_file_cache })}
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
                      onClick={() => setOptions({ ...options, flush_modified_list: !options.flush_modified_list })}
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
                      onClick={() => setOptions({ ...options, combine_physical_memory: !options.combine_physical_memory })}
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
                      onClick={() => setOptions({ ...options, registry_reconciliation: !options.registry_reconciliation })}
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
            </div>

            {/* 执行战报与审计日志 */}
            {lastResult && lastResult.logs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
                  <Terminal className="w-4 h-4 text-cyan-600" />
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
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: 实用百宝箱 ======================= */}
        {activeTab === "tools" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-150">
            {/* 百宝箱介绍卡片 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    游戏与系统诊断百宝箱
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    快速唤起 Windows 原生系统诊断与游戏控制器校准工具，免去在控制面板中繁琐翻找
                  </p>
                </div>
              </div>
            </div>

            {/* 工具网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. DirectX 诊断工具 */}
              <div
                onClick={() => handleOpenTool("dxdiag", "DirectX 诊断工具")}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-cyan-600 transition-colors">
                    DirectX 诊断 (dxdiag)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    排查显卡驱动、声卡及 DirectX 3D 游戏硬件加速状态
                  </p>
                </div>
              </div>

              {/* 2. 游戏手柄与控制器设置 */}
              <div
                onClick={() => handleOpenTool("joy.cpl", "游戏控制器设置")}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                    游戏控制器设置 (joy.cpl)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Windows 原生手柄校准中心、摇杆死区与按键测试
                  </p>
                </div>
              </div>

              {/* 3. 任务管理器 */}
              <div
                onClick={() => handleOpenTool("taskmgr", "任务管理器")}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                    <Activity className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">
                    任务管理器 (Taskmgr)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    排查后台占用率极高的流氓进程、GPU 占用与游戏假死
                  </p>
                </div>
              </div>

              {/* 4. 高级系统属性与虚拟内存设置 */}
              <div
                onClick={() => handleOpenTool("sysdm.cpl", "高级系统设置")}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-purple-600 transition-colors">
                    高级系统设置 (sysdm.cpl)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    配置 Windows 虚拟内存分页大小、环境变量与视觉性能
                  </p>
                </div>
              </div>

              {/* 5. 打开系统临时目录 */}
              <div
                onClick={() => handleOpenTool("temp", "系统临时文件夹")}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                    打开系统临时目录 (%temp%)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    在文件资源管理器中打开 Windows 临时文件夹清理冗余缓存
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: 系统与关于 ======================= */}
        {activeTab === "about" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-150">
            {/* 系统环境看板 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
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
            </div>

            {/* 致敬开源社区 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-600" />
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
