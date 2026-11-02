import React, { useState, useEffect } from "react";
import { Check, AlertTriangle, Sparkles } from "lucide-react";
import {
  getSystemMemoryInfo,
  optimizeMemory,
  restartAppAsAdmin,
  openSystemTool,
  SystemMemoryInfo,
  MemoryOptimizeOptions,
  MemoryOptimizeResult,
} from "../../services/memoryApi";
import { MoreSidebar, MoreTab } from "./MoreSidebar";
import { MemoryTab } from "./MemoryTab";
import { ToolsTab } from "./ToolsTab";
import { AboutTab } from "./AboutTab";

interface MoreViewProps {
  isActive?: boolean;
}

export const MoreView: React.FC<MoreViewProps> = ({ isActive = true }) => {
  const [activeTab, setActiveTab] = useState<MoreTab>("memory");
  const [memInfo, setMemInfo] = useState<SystemMemoryInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<MemoryOptimizeResult | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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

      {/* 左侧侧边栏 */}
      <MoreSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 右侧工作区视口 */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeTab === "memory" && (
          <MemoryTab
            memInfo={memInfo}
            isLoading={isLoading}
            isOptimizing={isOptimizing}
            options={options}
            onOptionsChange={setOptions}
            lastResult={lastResult}
            onRefresh={fetchMemory}
            onOptimize={handleOptimize}
            onRestartAdmin={handleRestartAdmin}
            formatBytes={formatBytes}
          />
        )}

        {activeTab === "tools" && <ToolsTab onOpenTool={handleOpenTool} />}

        {activeTab === "about" && <AboutTab memInfo={memInfo} />}
      </main>
    </div>
  );
};
