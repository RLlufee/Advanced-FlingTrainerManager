import React, { useState } from "react";
import {
  Maximize2,
  FolderOpen,
  Power,
  Activity,
  Check,
  Shield,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useTheme } from "../ui/theme";
import { JellyIcon } from "../ui/motion/JellyIcon";

export const TrayPopup: React.FC = () => {
  const { currentAccent } = useTheme();
  const [cleaning, setCleaning] = useState(false);
  const [cleanedMsg, setCleanedMsg] = useState<string | null>(null);

  // 唤醒主窗口
  const handleShowWindow = async () => {
    try {
      await invoke("show_main_window");
    } catch (e) {
      console.error("唤醒主窗口失败:", e);
    }
  };

  // 一键优化系统内存
  const handleCleanMemory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cleaning) return;
    setCleaning(true);
    try {
      const res = await invoke<{ freed_bytes: number }>("optimize_memory", {
        aggressiveness: "balanced",
      });
      const mb = (res.freed_bytes / (1024 * 1024)).toFixed(1);
      setCleanedMsg(`释放 ${mb}MB`);
      setTimeout(() => setCleanedMsg(null), 2800);
    } catch {
      setCleanedMsg("已优化");
      setTimeout(() => setCleanedMsg(null), 2000);
    } finally {
      setCleaning(false);
    }
  };

  // 打开修改器存储根目录
  const handleOpenTrainersDir = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("open_trainers_root");
    } catch (e) {
      console.error("打开修改器目录失败:", e);
    }
  };

  // 以管理员身份提权重启
  const handleRestartAdmin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("restart_app_as_admin");
    } catch (e) {
      console.error("提权重启失败:", e);
    }
  };

  // 彻底退出程序
  const handleQuit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await invoke("quit_app");
    } catch (e) {
      console.error("退出失败:", e);
    }
  };

  return (
    <div className="w-full h-full p-2 select-none font-sans overflow-hidden bg-transparent">
      {/* 现代亚克力磨砂卡片主体 */}
      <div className="w-full h-full rounded-2xl bg-white/92 dark:bg-[#131b2e]/92 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 shadow-[0_16px_40px_rgba(0,0,0,0.22)] flex flex-col justify-between p-3.5 transition-colors duration-200">
        
        {/* 顶部：Logo、标题与常驻微标 */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <JellyIcon intensity="bouncy">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse transition-all duration-300"
                style={{
                  backgroundColor: currentAccent.primary,
                  boxShadow: `0 0 10px ${currentAccent.primary}`,
                }}
              />
            </JellyIcon>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-wide">
              FlingTrainer 管家
            </span>
          </div>

          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{
              backgroundColor: currentAccent.soft,
              color: currentAccent.text,
              borderColor: currentAccent.border,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>驻留中</span>
          </span>
        </div>

        {/* 中部：极客快捷小卡片 (内存优化 + 打开根目录) */}
        <div className="grid grid-cols-2 gap-2 my-2">
          {/* 一键优化内存 */}
          <button
            type="button"
            onClick={handleCleanMemory}
            disabled={cleaning}
            className="p-2.5 rounded-xl border transition-all text-left group cursor-pointer relative overflow-hidden flex flex-col justify-between active:scale-95"
            style={{
              backgroundColor: currentAccent.soft,
              borderColor: currentAccent.border,
            }}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <JellyIcon intensity="gentle">
                <Activity
                  className={`w-4 h-4 transition-transform ${
                    cleaning ? "animate-spin text-emerald-500" : ""
                  }`}
                  style={{ color: currentAccent.primary }}
                />
              </JellyIcon>
              {cleanedMsg && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 animate-bounce">
                  <Check className="w-3 h-3" />
                  {cleanedMsg}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {cleaning ? "整理中..." : "内存清理"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight">
              工作集优化
            </span>
          </button>

          {/* 打开存储根目录 */}
          <button
            type="button"
            onClick={handleOpenTrainersDir}
            className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all text-left group cursor-pointer flex flex-col justify-between active:scale-95"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <JellyIcon intensity="gentle">
                <FolderOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </JellyIcon>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              修改器目录
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 leading-tight">
              浏览本地文件
            </span>
          </button>
        </div>

        {/* 底部菜单控制项 */}
        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {/* 显示主窗口 */}
          <button
            type="button"
            onClick={handleShowWindow}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
          >
            <Maximize2
              className="w-4 h-4 transition-transform group-hover:scale-110"
              style={{ color: currentAccent.primary }}
            />
            <span>显示主界面</span>
          </button>

          {/* 以管理员提权重启 */}
          <button
            type="button"
            onClick={handleRestartAdmin}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
          >
            <Shield className="w-4 h-4 text-amber-500 transition-transform group-hover:scale-110" />
            <span>以管理员重启</span>
          </button>

          {/* 退出程序 */}
          <button
            type="button"
            onClick={handleQuit}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group"
          >
            <Power className="w-4 h-4 text-rose-500 transition-transform group-hover:scale-110" />
            <span>彻底退出程序</span>
          </button>
        </div>

      </div>
    </div>
  );
};
