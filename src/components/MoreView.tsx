import React, { useState, useEffect } from "react";
import {
  Cpu,
  Zap,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
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

interface MoreViewProps {
  isActive?: boolean;
}

export const MoreView: React.FC<MoreViewProps> = ({ isActive = true }) => {
  const [memInfo, setMemInfo] = useState<SystemMemoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
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
    }, 3500);
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
      // 激活时每 4 秒轻量刷新一次内存状态
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

  // 计算环形进度条百分比
  const percent = memInfo ? Math.round(memInfo.used_percent) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900 text-slate-100 select-none">
      {/* Toast 提示浮条 */}
      {toast && (
        <div className="absolute top-4 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md border animate-in fade-in slide-in-from-top duration-200">
          {toast.type === "success" && (
            <div className="bg-emerald-950/90 border-emerald-500/50 text-emerald-200 flex items-center gap-2 px-3 py-1.5 rounded">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium">{toast.message}</span>
            </div>
          )}
          {toast.type === "error" && (
            <div className="bg-rose-950/90 border-rose-500/50 text-rose-200 flex items-center gap-2 px-3 py-1.5 rounded">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-medium">{toast.message}</span>
            </div>
          )}
          {toast.type === "info" && (
            <div className="bg-cyan-950/90 border-cyan-500/50 text-cyan-200 flex items-center gap-2 px-3 py-1.5 rounded">
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium">{toast.message}</span>
            </div>
          )}
        </div>
      )}

      {/* 主滚动视图 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        {/* 顶部标题区（PCL II 风格宽幅 Header） */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                百宝箱与系统实用工具
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-cyan-300">
                  PCL2 CE 内存优化内核版
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                基于 Windows NT 内核与 PCL 社区版内存调度算法，深度释放进程工作集与待机缓存，告别游戏卡顿
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMemory(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              <span>刷新数据</span>
            </button>
          </div>
        </div>

        {/* 核心卡片 1：系统内存深度优化中心 */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 border border-slate-700/60 shadow-xl relative overflow-hidden">
          {/* 背景微拟物装饰光效 */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          {/* 权限提示栏 */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-sm text-slate-200">
                系统物理内存优化调度引擎
              </span>
            </div>

            {memInfo?.is_admin ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>管理员提权模式（解锁内核级待机列表与系统文件缓存清空）</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>普通用户模式（支持全进程工作集回收）</span>
                </div>
                <button
                  onClick={handleRestartAdmin}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-md transition-all cursor-pointer"
                  title="调用 Windows UAC 授权以管理员身份重启，解锁全部内核级待机内存清空权限"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>以管理员重启</span>
                </button>
              </div>
            )}
          </div>

          {/* 仪表盘与核心参数布局 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* 左侧：大型占用率圆环看板 */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 shadow-inner">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={`transition-all duration-700 ease-out ${
                      percent < 65
                        ? "stroke-emerald-400"
                        : percent < 85
                        ? "stroke-cyan-400"
                        : "stroke-rose-400"
                    }`}
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * percent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                    {percent}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                    已用物理内存
                  </span>
                </div>
              </div>

              {/* 进度条指示 */}
              <div className="w-full mt-3 px-2">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>负载评级</span>
                  <span
                    className={`font-semibold ${
                      percent < 60
                        ? "text-emerald-400"
                        : percent < 82
                        ? "text-cyan-400"
                        : "text-rose-400"
                    }`}
                  >
                    {percent < 60 ? "空闲舒适" : percent < 82 ? "正常负载" : "内存吃紧"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      percent < 60
                        ? "bg-emerald-400"
                        : percent < 82
                        ? "bg-cyan-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 中间：物理与分页内存详情指标 */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                  <span className="text-xs text-slate-300">当前已用物理内存</span>
                </div>
                <span className="text-sm font-semibold text-slate-100 font-mono">
                  {memInfo ? formatBytes(memInfo.used_phys_bytes) : "--"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  <span className="text-xs text-slate-300">当前可用空闲内存</span>
                </div>
                <span className="text-sm font-semibold text-emerald-300 font-mono">
                  {memInfo ? formatBytes(memInfo.avail_phys_bytes) : "--"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-300">安装物理内存总计</span>
                </div>
                <span className="text-sm font-semibold text-slate-300 font-mono">
                  {memInfo ? formatBytes(memInfo.total_phys_bytes) : "--"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                  <span className="text-xs text-slate-300">系统分页虚拟文件</span>
                </div>
                <span className="text-sm font-semibold text-indigo-300 font-mono">
                  {memInfo ? formatBytes(memInfo.avail_pagefile_bytes) : "--"} 可用 /{" "}
                  {memInfo ? formatBytes(memInfo.total_pagefile_bytes) : "--"}
                </span>
              </div>
            </div>

            {/* 右侧：优化操作大按钮与战报 */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-4">
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                    <span>正在进行内核级深层优化……</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-amber-300 fill-current group-hover:scale-110 transition-transform" />
                    <span>⚡ 一键深度优化物理内存</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-400 leading-relaxed text-center px-2">
                Windows NT 内核系统调用，清理物理工作集与备用缓存（Standby
                List），效果显著，非普通 GC 伪清理可比。
              </div>

              {lastResult && (
                <div className="w-full p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
                  <span className="font-medium">上次优化战报:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    +{formatBytes(lastResult.freed_bytes)} 释放
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 高级微调折叠项 */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium">高级内存清理项目细粒度配置 (7 大系统级动作)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>{showOptions ? "收起参数" : "展开高级参数"}</span>
                {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showOptions && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs cursor-pointer hover:border-slate-600">
                  <div>
                    <div className="font-semibold text-slate-200">清空进程工作集 (Empty Working Sets)</div>
                    <div className="text-[10px] text-slate-400">回收后台各进程的非活跃工作集物理内存</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.empty_working_sets}
                    onChange={(e) => setOptions({ ...options, empty_working_sets: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs cursor-pointer hover:border-slate-600">
                  <div>
                    <div className="font-semibold text-slate-200">清空待机内存列表 (Purge Standby List)</div>
                    <div className="text-[10px] text-slate-400">将系统缓存备用内存瞬间转化为可用内存（核心）</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.purge_standby_list}
                    onChange={(e) => setOptions({ ...options, purge_standby_list: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs cursor-pointer hover:border-slate-600">
                  <div>
                    <div className="font-semibold text-slate-200">刷新系统文件缓存 (Flush File Cache)</div>
                    <div className="text-[10px] text-slate-400">重置超大文件读写遗留的系统文件工作集映射</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.flush_file_cache}
                    onChange={(e) => setOptions({ ...options, flush_file_cache: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs cursor-pointer hover:border-slate-600">
                  <div>
                    <div className="font-semibold text-slate-200">刷写修改页列表 (Flush Modified List)</div>
                    <div className="text-[10px] text-slate-400">将已修改未落盘的页面刷写到分页存储</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.flush_modified_list}
                    onChange={(e) => setOptions({ ...options, flush_modified_list: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs cursor-pointer hover:border-slate-600">
                  <div>
                    <div className="font-semibold text-slate-200">物理内存页去重合并 (Combine Memory)</div>
                    <div className="text-[10px] text-slate-400">扫描重复内容的内存页并进行透明引用合并</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.combine_physical_memory}
                    onChange={(e) => setOptions({ ...options, combine_physical_memory: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg bg-slate-900/70 border border-slate-700/40 text-xs cursor-pointer hover:border-slate-600">
                  <div>
                    <div className="font-semibold text-slate-200">注册表协调与释放 (Registry Reconcile)</div>
                    <div className="text-[10px] text-slate-400">向 Windows 注册表管理器发出内存回收协调指令</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.registry_reconciliation}
                    onChange={(e) => setOptions({ ...options, registry_reconciliation: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* 实时执行日志终端小面板 */}
          {lastResult && lastResult.logs.length > 0 && (
            <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 pb-1 border-b border-slate-800 font-sans font-semibold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>本次优化执行详情日志</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-0.5 custom-scrollbar pt-1">
                {lastResult.logs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-600">❯</span>
                    <span className="text-slate-300">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 核心卡片 2：常用游戏与系统诊断百宝箱 */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/40 to-slate-900/90 border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <Gamepad2 className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="font-semibold text-sm text-slate-200">
                  常用游戏与系统快捷百宝箱
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  一键调起 Windows 原生系统诊断与游戏环境调试工具
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. DirectX 诊断工具 */}
            <div
              onClick={() => handleOpenTool("dxdiag", "DirectX 诊断工具")}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Monitor className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors">
                  DirectX 诊断 (dxdiag)
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  排查显卡驱动、声卡及 DirectX 3D 游戏硬件加速状态
                </div>
              </div>
            </div>

            {/* 2. 游戏手柄与控制器设置 */}
            <div
              onClick={() => handleOpenTool("joy.cpl", "游戏控制器设置")}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors">
                  游戏控制器设置 (joy.cpl)
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Windows 原生手柄校准中心、摇杆死区与按键测试
                </div>
              </div>
            </div>

            {/* 3. 任务管理器 */}
            <div
              onClick={() => handleOpenTool("taskmgr", "任务管理器")}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors">
                  任务管理器 (Taskmgr)
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  排查后台占用率极高的流氓进程、GPU 占用与游戏假死
                </div>
              </div>
            </div>

            {/* 4. 高级系统属性与虚拟内存设置 */}
            <div
              onClick={() => handleOpenTool("sysdm.cpl", "高级系统设置")}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-purple-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-100 group-hover:text-purple-300 transition-colors">
                  高级系统设置 (sysdm.cpl)
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  配置 Windows 虚拟内存分页大小、环境变量与视觉性能
                </div>
              </div>
            </div>

            {/* 5. 打开系统临时目录 */}
            <div
              onClick={() => handleOpenTool("temp", "系统临时文件夹")}
              className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-100 group-hover:text-amber-300 transition-colors">
                  打开系统临时目录 (%temp%)
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  在文件资源管理器中打开 Windows 临时文件夹清理冗余缓存
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息卡片 */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/70 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Advanced FlingTrainerManager 百宝箱模块已就绪</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Memory optimization inspired by <span className="text-slate-300 font-semibold">PCL2 CE</span> (Plain Craft Launcher 2 Community Edition)
          </div>
        </div>
      </div>
    </div>
  );
};
