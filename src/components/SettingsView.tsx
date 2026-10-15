import React, { useState, useEffect } from "react";
import {
  Keyboard,
  FolderCog,
  Zap,
  ShieldCheck,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  Check,
  Copy,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  Play,
  Flame,
} from "lucide-react";
import {
  configApi,
  AppConfig,
  HotkeySettings,
} from "../services/configApi";

export type SettingsTab = "hotkey" | "management" | "network";

interface SettingsViewProps {
  isActive?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ isActive = true }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("hotkey");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // 备份与还原弹窗状态
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importInput, setImportInput] = useState<string>("");
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // 读取全局配置
  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const cfg = await configApi.getConfig();
      setConfig(cfg);
    } catch (e) {
      showToast("error", `读取配置失败: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadConfig();
    }
  }, [isActive]);

  // 保存热键子项配置并即时写盘
  const updateHotkeySettings = async (partial: Partial<HotkeySettings>) => {
    if (!config) return;
    const newHotkey = { ...config.hotkey, ...partial };
    const newConfig: AppConfig = {
      ...config,
      hotkey: newHotkey,
    };
    setConfig(newConfig);

    try {
      await configApi.saveConfig(newConfig);
    } catch (e) {
      showToast("error", `保存配置失败: ${e}`);
    }
  };

  // 导出所有修改器开关预设
  const handleExportPresets = async () => {
    try {
      const json = await configApi.exportAllPresets();
      setExportJson(json);
      setIsCopied(false);
    } catch (e) {
      showToast("error", `导出预设失败: ${e}`);
    }
  };

  // 复制导出内容
  const handleCopyExportJson = async () => {
    if (!exportJson) return;
    try {
      await navigator.clipboard.writeText(exportJson);
      setIsCopied(true);
      showToast("success", "已将全部修改器开关预设备份复制到剪贴板！");
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      showToast("error", `复制到剪贴板失败: ${e}`);
    }
  };

  // 导入并还原预设
  const handleImportPresets = async () => {
    if (!importInput.trim()) {
      showToast("info", "请先粘贴预设备份的 JSON 内容喵~");
      return;
    }
    try {
      const count = await configApi.importAllPresets(importInput.trim());
      showToast("success", `🎉 导入还原成功！已恢复 ${count} 款修改器的开关预设喵~`);
      setShowImportModal(false);
      setImportInput("");
    } catch (e) {
      showToast("error", `导入预设失败: ${e}`);
    }
  };

  // 清空所有游戏预设
  const handleClearAllPresets = async () => {
    try {
      const count = await configApi.clearAllPresets();
      showToast("info", `已清空 ${count} 款修改器的开关预设`);
      setShowClearConfirm(false);
    } catch (e) {
      showToast("error", `清空预设失败: ${e}`);
    }
  };

  if (!config && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#edf0f5] text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span>正在加载设置项...</span>
        </div>
      </div>
    );
  }

  const hotkey = config?.hotkey || {
    run_as_admin: true,
    key_interval_ms: 100,
    key_hold_ms: 40,
    auto_sync_on_double_launch: true,
    double_launch_delay_sec: 3,
    show_sync_toast: true,
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#edf0f5] select-none font-sans">
      {/* 浮动轻量 Toast 提示 */}
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

      {/* 左侧侧边栏导航 (PCL II 工业极简质感) */}
      <aside className="w-48 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none shadow-2xs">
        <div className="p-3 space-y-1">
          {/* 1. 热键 */}
          <button
            onClick={() => setActiveTab("hotkey")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
              activeTab === "hotkey"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Keyboard className={`w-4 h-4 ${activeTab === "hotkey" ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-600"}`} />
              <span>热键</span>
            </div>
            {activeTab === "hotkey" && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* 2. 管理 */}
          <button
            onClick={() => setActiveTab("management")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
              activeTab === "management"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderCog className={`w-4 h-4 ${activeTab === "management" ? "text-cyan-400" : "text-slate-400 group-hover:text-cyan-600"}`} />
              <span>管理</span>
            </div>
            {activeTab === "management" && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>

          {/* 3. 网络与加速 */}
          <button
            onClick={() => setActiveTab("network")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
              activeTab === "network"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${activeTab === "network" ? "text-amber-400" : "text-slate-400 group-hover:text-amber-500"}`} />
              <span>网络与加速</span>
            </div>
            {activeTab === "network" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        <div className="mt-auto p-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>配置持久化</span>
            <span className="text-cyan-600 font-mono text-[10px]">app_config.json</span>
          </div>
          <p className="text-[10px] text-slate-400/80 leading-relaxed">
            修改即时自动落盘保存
          </p>
        </div>
      </aside>

      {/* 右侧卡片式工作区 */}
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* ======================= TAB 1: 热键 ======================= */}
        {activeTab === "hotkey" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 卡片 1：🛡️ 管理员提权策略 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      以管理员身份提权启动修改器
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      单机大作（如《艾尔登法环》、《赛博朋克2077》）常运行在高完整性权限下。开启后启动修改器将触发 Windows UAC 提权授权，确保全局热键钩子正常监听、内存成功注入且绝不闪退。
                    </p>
                  </div>
                </div>

                {/* 开关组件 */}
                <button
                  type="button"
                  onClick={() => updateHotkeySettings({ run_as_admin: !hotkey.run_as_admin })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hotkey.run_as_admin ? "bg-cyan-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      hotkey.run_as_admin ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 卡片 2：⚡ 模拟按键防吞键微调引擎 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    模拟按键时序与防吞键引擎
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    在点击“一键同步”时，系统将依序模拟键盘按键。通过微调按键间隔与持续时长，可彻底消除不同游戏引擎（卡普空 RE、虚幻引擎等）因连击过快导致的按键丢失。
                  </p>
                </div>
              </div>

              {/* 滑块 1：按键间隔 */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    热键按序触发间隔 (Interval)
                  </span>
                  <span className="font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                    {hotkey.key_interval_ms} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={hotkey.key_interval_ms}
                  onChange={(e) => updateHotkeySettings({ key_interval_ms: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>20 ms (极速激进)</span>
                  <span>100 ms (推荐标准)</span>
                  <span>300 ms (老游戏从容)</span>
                </div>
              </div>

              {/* 滑块 2：单键按下时长 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-slate-400" />
                    单个按键保持按下时长 (Hold Duration)
                  </span>
                  <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    {hotkey.key_hold_ms} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="150"
                  step="5"
                  value={hotkey.key_hold_ms}
                  onChange={(e) => updateHotkeySettings({ key_hold_ms: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>15 ms (瞬时点触)</span>
                  <span>40 ms (默认稳定)</span>
                  <span>150 ms (深按确认)</span>
                </div>
              </div>

              {/* 推荐调优说明 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span>
                  <strong>小贴士</strong>：若在游戏里发现有一半功能没有被激活，通常是按键太快被游戏内部输入队列吃掉了。建议将间隔调至 <strong>100~150ms</strong> 即可完美解决。
                </span>
              </div>
            </div>

            {/* 卡片 3：🎮 一键双启联动策略 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                  <Play className="w-5 h-5 fill-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    一键双启感知与自动同步预设
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    在启动页点击“一键双启”时，系统将唤起 Steam 游戏并拉起修改器。此选项决定是否在游戏主界面加载完成后，自动为您激活所有开关预设。
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                {/* 开关：双启时自动同步预设 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">
                      一键双启后自动模拟按键开启已保存的功能预设
                    </span>
                    <p className="text-[11px] text-slate-400">
                      免去每次进游戏都得手动点一次“一键同步”的重复繁琐操作
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateHotkeySettings({
                        auto_sync_on_double_launch: !hotkey.auto_sync_on_double_launch,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      hotkey.auto_sync_on_double_launch ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        hotkey.auto_sync_on_double_launch ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 延迟等待秒数滑块 */}
                {hotkey.auto_sync_on_double_launch && (
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        启动游戏后延迟执行按键同步 (等待游戏加载进菜单)
                      </span>
                      <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                        {hotkey.double_launch_delay_sec} 秒
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={hotkey.double_launch_delay_sec}
                      onChange={(e) =>
                        updateHotkeySettings({
                          double_launch_delay_sec: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-indigo-200/80 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}

                {/* 开关：模拟完成气泡提示 */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-800">
                    热键模拟完成时在右下角弹出状态反馈气泡
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateHotkeySettings({
                        show_sync_toast: !hotkey.show_sync_toast,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      hotkey.show_sync_toast ? "bg-cyan-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        hotkey.show_sync_toast ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 卡片 4：🔄 全局预设备份、恢复与重置 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    全局预设备份、迁移与重置
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    在所有游戏中精心调整的个性化开挂功能开关预设（如无敌、无限金币等），支持一键打包备份与跨设备恢复。
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
                {/* 导出备份 */}
                <button
                  type="button"
                  onClick={handleExportPresets}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>导出所有预设 (JSON)</span>
                </button>

                {/* 导入预设 */}
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>导入恢复预设</span>
                </button>

                {/* 清空所有预设 */}
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/70 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>清空全部预设</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: 管理 (第二步预留) ======================= */}
        {activeTab === "management" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center text-slate-500 space-y-3">
              <FolderCog className="w-10 h-10 mx-auto text-cyan-600 stroke-[1.5] animate-pulse" />
              <h2 className="text-base font-bold text-slate-800">
                管理模块（第二步即将接入）
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                便携存储目录自由更改、一键平滑无损迁移现有全部修改器、自动解压 ZIP、以及本地海报缓存一键清理功能正按三步走计划准备就绪喵~
              </p>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: 网络与加速 (第三步预留) ======================= */}
        {activeTab === "network" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-8 text-center text-slate-500 space-y-3">
              <Zap className="w-10 h-10 mx-auto text-amber-500 stroke-[1.5] animate-bounce" />
              <h2 className="text-base font-bold text-slate-800">
                网络与加速模块（第三步即将接入）
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                本地自定义网络代理（HTTP / SOCKS5 支持 7890 端口）、GitHub 官方源与国内镜像加速节点切换、Steam CDN 镜像配置将在此登场喵~
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 导出 JSON 预览弹窗 */}
      {exportJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-600" />
                所有修改器开关预设备份数据
              </h3>
              <button
                onClick={() => setExportJson(null)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                关闭
              </button>
            </div>
            <textarea
              readOnly
              value={exportJson}
              rows={10}
              className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleCopyExportJson}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "已复制到剪贴板！" : "复制备份 JSON"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入预设弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-600" />
                导入还原开关预设
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                取消
              </button>
            </div>
            <p className="text-xs text-slate-500">
              请在此处粘贴此前导出的预设 JSON 文本，系统将根据游戏名与 ID 自动匹配并覆盖更新已安装游戏的开关配置：
            </p>
            <textarea
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="在此粘贴包含 saved_toggles 的 JSON 数组..."
              rows={9}
              className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleImportPresets}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>立即导入并还原</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清空预设二次确认模态窗 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                确定要清空全部预设吗？
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                此操作将把所有已安装修改器的开关预设重置为空，修改器文件本体不会受到任何影响。
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleClearAllPresets}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                确认彻底清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
