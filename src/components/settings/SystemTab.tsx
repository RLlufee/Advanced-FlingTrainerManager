import React, { useState } from "react";
import {
  Monitor,
  Power,
  Shield,
  RotateCcw,
  Info,
} from "lucide-react";
import { ManagementSettings } from "../../services/configApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { useTheme } from "../ui/theme";
import { invoke } from "@tauri-apps/api/core";

interface SystemTabProps {
  management: ManagementSettings;
  onUpdateManagement: (partial: Partial<ManagementSettings>) => void;
  onToggleStartup: (enable: boolean) => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export const SystemTab: React.FC<SystemTabProps> = ({
  management,
  onUpdateManagement,
  onToggleStartup,
  showToast,
}) => {
  const { currentAccent } = useTheme();
  const [isRestartingAdmin, setIsRestartingAdmin] = useState(false);

  const handleRestartAsAdmin = async () => {
    setIsRestartingAdmin(true);
    try {
      await invoke("restart_app_as_admin");
      showToast("info", "已尝试以管理员权限重新启动管理器喵~");
    } catch (e) {
      showToast("error", `提权重启失败: ${e}`);
    } finally {
      setIsRestartingAdmin(false);
    }
  };

  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 卡片 1：🪟 窗口行为与托盘驻留偏好 */}
      <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors"
              style={{
                backgroundColor: currentAccent.soft,
                color: currentAccent.text,
                border: `1px solid ${currentAccent.border}`,
              }}
            >
              <Monitor className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>窗口行为与系统托盘驻留</span>
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors"
                  style={
                    management.close_to_tray
                      ? {
                          backgroundColor: currentAccent.soft,
                          color: currentAccent.text,
                          borderColor: currentAccent.border,
                        }
                      : {
                          backgroundColor: "rgba(148, 163, 184, 0.12)",
                          color: "#64748b",
                          borderColor: "rgba(203, 213, 225, 0.8)",
                        }
                  }
                >
                  {management.close_to_tray ? "已开启后台驻留" : "默认关闭 (点击X直接退出)"}
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              控制用户点击标题栏关闭按钮（X）、Windows 任务栏关闭或快捷键 Alt+F4 时的响应逻辑。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
            <div className="space-y-0.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  点击关闭按钮时最小化到系统托盘
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                开启后，关闭窗口将平滑隐藏至右下角系统托盘，避免误触重新冷启动；关闭状态下点击关闭将干净利落地彻底退出应用程序。
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateManagement({
                  close_to_tray: !management.close_to_tray,
                })
              }
              style={{
                backgroundColor: management.close_to_tray ? currentAccent.primary : undefined,
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                management.close_to_tray ? "" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  management.close_to_tray ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div
            className="p-3 rounded-xl text-[11px] flex items-start gap-2 transition-colors"
            style={{
              backgroundColor: currentAccent.soft,
              color: currentAccent.text,
              border: `1px solid ${currentAccent.border}`,
            }}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: currentAccent.primary }} />
            <span>
              <strong>托盘快捷操作提示</strong>：隐藏至托盘后，鼠标单击或双击右下角托盘图标即可随时瞬间唤醒置顶；右键点击托盘图标可展开菜单并选择“退出程序”。
            </span>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 2：🚀 开机自启与静默驻留 */}
      <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors"
              style={{
                backgroundColor: currentAccent.soft,
                color: currentAccent.text,
                border: `1px solid ${currentAccent.border}`,
              }}
            >
              <Power className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Windows 登录自启动</span>
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors"
                  style={
                    management.launch_at_startup
                      ? {
                          backgroundColor: currentAccent.soft,
                          color: currentAccent.text,
                          borderColor: currentAccent.border,
                        }
                      : {
                          backgroundColor: "rgba(148, 163, 184, 0.12)",
                          color: "#64748b",
                          borderColor: "rgba(203, 213, 225, 0.8)",
                        }
                  }
                >
                  {management.launch_at_startup ? "已开机自启" : "未开启"}
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              向当前用户的 Windows 注册表 Run 键写入启动项，开机登录后自动启动修改器管理器。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
            <div className="space-y-0.5 max-w-xl">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Windows 登录时自动启动修改器管理器！
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                开机自动常驻后台，在运行大型 3A 大作或独立游戏时可随叫随到，无需翻找快捷方式。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleStartup(!management.launch_at_startup)}
              style={{
                backgroundColor: management.launch_at_startup ? currentAccent.primary : undefined,
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                management.launch_at_startup ? "" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  management.launch_at_startup ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 3：🛡️ 权限与系统运行治理 */}
      <PaperCard className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors"
              style={{
                backgroundColor: currentAccent.soft,
                color: currentAccent.text,
                border: `1px solid ${currentAccent.border}`,
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>系统权限与环境治理</span>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded-full border"
                style={{
                  backgroundColor: currentAccent.soft,
                  color: currentAccent.text,
                  borderColor: currentAccent.border,
                }}
              >
                UAC 与原生支持
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              部分修改器注入或跨盘符迁移需要 Windows 管理员提权支持。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                以管理员身份重新启动管理器
              </span>
              <p className="text-[11px] text-slate-400">
                触发 Windows UAC 提示并以完全提权状态运行，解决注入修改器时的权限拦截
              </p>
            </div>
            <TypewriterTooltip text="触发系统 UAC 提示并重启管理器" position="left">
              <button
                type="button"
                onClick={handleRestartAsAdmin}
                disabled={isRestartingAdmin}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <JellyIcon intensity="bouncy">
                  <RotateCcw className={`w-3.5 h-3.5 ${isRestartingAdmin ? "animate-spin" : ""}`} style={{ color: currentAccent.primary }} />
                </JellyIcon>
                <span>{isRestartingAdmin ? "正在启动..." : "提权重启管理器"}</span>
              </button>
            </TypewriterTooltip>
          </div>
        </div>
      </PaperCard>
    </PaperContainer>
  );
};
