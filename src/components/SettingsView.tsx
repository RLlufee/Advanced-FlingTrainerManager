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
  FolderOpen,
  HardDrive,
  Archive,
  Trash2,
  Layers,
  ExternalLink,
  MoveRight,
  Database,
  Monitor,
  RefreshCw,
  Globe,
  Wifi,
  Activity,
  CheckCircle2,
  XCircle,
  Radio,
} from "lucide-react";
import {
  configApi,
  AppConfig,
  HotkeySettings,
  ManagementSettings,
  NetworkSettings,
  NetworkTestResult,
  StorageStats,
} from "../services/configApi";
import { trainerApi } from "../services/trainerApi";

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

  // 管理模块状态
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isScanningStorage, setIsScanningStorage] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrateTargetDir, setMigrateTargetDir] = useState<string | null>(null);
  const [showMigrateModal, setShowMigrateModal] = useState<boolean>(false);
  const [isCleaningCache, setIsCleaningCache] = useState<boolean>(false);

  // 网络模块状态
  const [isTestingNetwork, setIsTestingNetwork] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<NetworkTestResult | null>(null);
  const [testTarget, setTestTarget] = useState<string>("https://flingtrainer.com");

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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

  // 读取存储统计
  const loadStorageStats = async () => {
    setIsScanningStorage(true);
    try {
      const stats = await configApi.getStorageStats();
      setStorageStats(stats);
    } catch (e) {
      console.warn("读取存储统计失败:", e);
    } finally {
      setIsScanningStorage(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadConfig();
      if (activeTab === "management") {
        loadStorageStats();
      }
    }
  }, [isActive, activeTab]);

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

  // 更新管理模块配置
  const updateManagementSettings = async (partial: Partial<ManagementSettings>) => {
    if (!config) return;
    const newMgmt = { ...config.management, ...partial };
    const newConfig: AppConfig = {
      ...config,
      management: newMgmt,
    };
    setConfig(newConfig);

    try {
      await configApi.saveConfig(newConfig);
    } catch (e) {
      showToast("error", `保存管理设置失败: ${e}`);
    }
  };

  // 选择新存储目录
  const handlePickNewDirectory = async () => {
    try {
      const chosen = await configApi.pickDirectory();
      if (!chosen) return;
      if (storageStats && chosen.toLowerCase() === storageStats.trainers_dir.toLowerCase()) {
        showToast("info", "所选目录与当前存储目录完全一致喵~");
        return;
      }
      setMigrateTargetDir(chosen);
      setShowMigrateModal(true);
    } catch (e) {
      showToast("error", `选择目录失败: ${e}`);
    }
  };

  // 执行一键无损迁移
  const handleStartMigration = async () => {
    if (!migrateTargetDir) return;
    setIsMigrating(true);
    showToast("info", "正在将所有修改器文件无损搬家至新目录，请稍候喵...");
    try {
      const count = await configApi.migrateTrainersDir(migrateTargetDir);
      showToast("success", `🎉 搬家大成功！已将 ${count} 款修改器完整迁移至新目录喵~`);
      setShowMigrateModal(false);
      setMigrateTargetDir(null);
      await loadConfig();
      await loadStorageStats();
    } catch (e) {
      showToast("error", `迁移目录失败: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  // 仅切换路径不移动文件
  const handleSwitchPathOnly = async () => {
    if (!migrateTargetDir) return;
    await updateManagementSettings({ custom_trainers_dir: migrateTargetDir });
    showToast("success", "已将修改器存储路径切换到新目录喵~");
    setShowMigrateModal(false);
    setMigrateTargetDir(null);
    await loadStorageStats();
  };

  // 在系统文件资源管理器中打开当前 trainers 目录
  const handleOpenCurrentTrainersDir = async () => {
    try {
      await trainerApi.openTrainersRoot();
    } catch (e) {
      showToast("error", `打开文件夹失败: ${e}`);
    }
  };

  // 清理临时解压缓存
  const handleCleanCache = async () => {
    setIsCleaningCache(true);
    try {
      const summary = await configApi.cleanOrphanCache();
      showToast(
        "success",
        `🎉 清理完成！共清除 ${summary.cleaned_files_count} 个临时文件，释放 ${formatBytes(summary.freed_bytes)} 空间喵~`
      );
      await loadStorageStats();
    } catch (e) {
      showToast("error", `清理缓存失败: ${e}`);
    } finally {
      setIsCleaningCache(false);
    }
  };

  // 开机自启动切换
  const handleToggleStartup = async (enable: boolean) => {
    try {
      await configApi.setLaunchAtStartup(enable);
      await updateManagementSettings({ launch_at_startup: enable });
      showToast("success", enable ? "已开启 Windows 登录自动启动喵~" : "已关闭开机自启");
    } catch (e) {
      showToast("error", `配置开机自启失败: ${e}`);
    }
  };

  // 更新网络与加速设置
  const updateNetworkSettings = async (partial: Partial<NetworkSettings>) => {
    if (!config) return;
    const newNet = { ...config.network, ...partial };
    const newConfig: AppConfig = {
      ...config,
      network: newNet,
    };
    setConfig(newConfig);

    try {
      await configApi.saveConfig(newConfig);
    } catch (e) {
      showToast("error", `保存网络设置失败: ${e}`);
    }
  };

  // 测试网络/代理连通性
  const handleTestNetwork = async (target?: string) => {
    setIsTestingNetwork(true);
    setTestResult(null);
    try {
      const res = await configApi.testNetworkConnectivity(target || testTarget);
      setTestResult(res);
      if (res.success) {
        showToast("success", `⚡ 连通成功！延迟 ${res.latency_ms}ms 喵~`);
      } else {
        showToast("error", `连接失败: ${res.message}`);
      }
    } catch (e) {
      showToast("error", `测试连通性失败: ${e}`);
    } finally {
      setIsTestingNetwork(false);
    }
  };

  // 恢复默认网络设置
  const handleResetNetwork = async () => {
    const defaultNetwork: NetworkSettings = {
      proxy_mode: "system",
      proxy_url: "",
      update_source: "official",
      enable_steam_cdn: true,
      steam_cdn_host: "shared.cloudflare.steamstatic.com",
      timeout_ms: 8000,
      max_retry_count: 2,
    };
    await updateNetworkSettings(defaultNetwork);
    setTestResult(null);
    showToast("info", "已恢复为默认网络设置喵~");
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

  const management = config?.management || {
    custom_trainers_dir: null,
    auto_extract_zip: true,
    scan_depth: 2,
    close_to_tray: true,
    launch_at_startup: false,
  };

  const network = config?.network || {
    proxy_mode: "system",
    proxy_url: "",
    update_source: "official",
    enable_steam_cdn: true,
    steam_cdn_host: "shared.cloudflare.steamstatic.com",
    timeout_ms: 8000,
    max_retry_count: 2,
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
                      以管理员身份提权启动修改器（建议开启⚠️）
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

        {/* ======================= TAB 2: 管理 ======================= */}
        {activeTab === "management" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 卡片 1：📦 便携存储根目录与一键无损迁移 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>修改器便携存储根目录</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full">
                        便携模式生效中
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      每个游戏拥有独立的专属子目录，内含 exe 修改器、结构化看板数据（trainer.json）与离线原画（cover.jpg）。支持自由变更盘符路径，并提供一键自动搬家无损迁移。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadStorageStats}
                  disabled={isScanningStorage}
                  title="重新扫描并刷新存储与缓存容量"
                  className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanningStorage ? "animate-spin text-cyan-600" : ""}`} />
                </button>
              </div>

              {/* 当前存储路径条 */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={storageStats?.trainers_dir || "正在读取路径..."}
                    className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePickNewDirectory}
                    className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>更改目录...</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCurrentTrainersDir}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
                    title="在系统文件资源管理器中打开此目录"
                  >
                    <ExternalLink className="w-4 h-4 text-cyan-600" />
                  </button>
                </div>

                {/* 存储三项微型看板 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">已纳管修改器</span>
                    <p className="text-sm font-bold font-mono text-slate-800">
                      {storageStats?.trainers_count ?? 0} <span className="text-xs font-normal text-slate-500">款游戏</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">当前目录总占用</span>
                    <p className="text-sm font-bold font-mono text-cyan-700">
                      {formatBytes(storageStats?.total_size_bytes ?? 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">本地封面海报缓存</span>
                    <p className="text-sm font-bold font-mono text-emerald-700">
                      {storageStats?.cover_cache_count ?? 0} <span className="text-xs font-normal text-slate-500">张 ({formatBytes(storageStats?.cover_cache_size_bytes ?? 0)})</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片 2：📥 外部导入与解压自动化规则 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    外部导入与解压自动化规则
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    在从外部文件夹批量扫描导入修改器，或从官网下载压缩包时所触发的解构、提取与净化规则。
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                {/* 开关：遇到 zip 自动解压 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">
                      遇到 ZIP 压缩包时自动解压并提取 .exe 主程序
                    </span>
                    <p className="text-[11px] text-slate-400">
                      自动剔除无关的说明文档或多余包装层，仅保留最核心的修改器可执行文件
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateManagementSettings({
                        auto_extract_zip: !management.auto_extract_zip,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      management.auto_extract_zip ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        management.auto_extract_zip ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 扫描穿透深度滑块 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      扫描导入目录最大递归穿透深度
                    </span>
                    <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                      {management.scan_depth} 层子目录
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={management.scan_depth}
                    onChange={(e) =>
                      updateManagementSettings({
                        scan_depth: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-indigo-200/80 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>1 层 (仅选定根目录)</span>
                    <span>2 层 (推荐标准)</span>
                    <span>4 层 (深度穿透)</span>
                  </div>
                </div>

                {/* 黑名单内置说明 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>智能净化机制</strong>：系统已全自动排除 <code>unins000.exe</code>、<code>setup.exe</code>、<code>dxwebsetup.exe</code>、<code>vc_redist.exe</code> 以及 Unity 崩溃日志收集器等干扰项，确保已安装列表纯净整齐。
                  </span>
                </div>
              </div>
            </div>

            {/* 卡片 3：🧹 缓存清理与本地离线字典 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    缓存清理与本地离线词库
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    维护本地临时导入产生的碎片文件，并监控内置 SQLite 离线中英游戏翻译对照库的运行状态。
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                {/* 临时解压缓存清理 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">
                      临时解压与扫描导入临时缓存
                    </span>
                    <p className="text-[11px] text-slate-400">
                      定期清理系统临时目录中的解压碎片，不影响已成功建档的修改器文件
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCleanCache}
                    disabled={isCleaningCache}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className={`w-3.5 h-3.5 text-amber-600 ${isCleaningCache ? "animate-spin" : ""}`} />
                    <span>{isCleaningCache ? "正在清理..." : "一键清理临时缓存"}</span>
                  </button>
                </div>

                {/* 本地 SQLite 离线词库状态 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-cyan-600" />
                    <div>
                      <span className="text-xs font-semibold text-slate-800">
                        本地 SQLite 游戏名称离线映射库
                      </span>
                      <p className="text-[11px] text-slate-400">
                        断网时亦能秒级将中文游戏名反向映射为风灵月影官网标准 Slug
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                      收录 {storageStats?.offline_dict_count ?? 1185}+ 款游戏
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 卡片 4：🪟 窗口行为与开机启动 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    窗口行为与开机自启
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    定义关闭客户端时的系统托盘驻留偏好，以及 Windows 登录自动加载。
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                {/* 开机自启 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">
                      Windows 登录时自动启动修改器管家
                    </span>
                    <p className="text-[11px] text-slate-400">
                      开机静默常驻，玩游戏时随时快捷调出修改器
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStartup(!management.launch_at_startup)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      management.launch_at_startup ? "bg-purple-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        management.launch_at_startup ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 关闭窗口最小化到托盘 */}
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">
                      点击关闭按钮时最小化到系统托盘
                    </span>
                    <p className="text-[11px] text-slate-400">
                      保持客户端后台驻留，避免误关后重新冷启动
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateManagementSettings({
                        close_to_tray: !management.close_to_tray,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      management.close_to_tray ? "bg-cyan-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        management.close_to_tray ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: 网络与加速 ======================= */}
        {activeTab === "network" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* 卡片 1: 本地网络代理配置 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  <Globe className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    网络代理与分流模式
                  </h2>
                  <p className="text-xs text-slate-400">
                    配置本地 HTTP / SOCKS5 代理客户端（如 Clash、v2rayN、Mihomo 等），彻底打通风灵月影官网与海外资源
                  </p>
                </div>
              </div>

              {/* 代理模式选择胶囊 */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => updateNetworkSettings({ proxy_mode: "system" })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    network.proxy_mode === "system"
                      ? "bg-white text-cyan-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-600" />
                  <span>跟随系统代理</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateNetworkSettings({ proxy_mode: "custom" })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    network.proxy_mode === "custom"
                      ? "bg-white text-cyan-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5 text-cyan-600" />
                  <span>自定义本地代理</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateNetworkSettings({ proxy_mode: "direct" })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    network.proxy_mode === "direct"
                      ? "bg-white text-cyan-800 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>直接连接 (禁用代理)</span>
                </button>
              </div>

              {/* 自定义本地代理配置区 */}
              {network.proxy_mode === "custom" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-600" />
                      <span>自定义代理服务器 URL (支持 HTTP / SOCKS5 协议)</span>
                    </label>
                    <input
                      type="text"
                      value={network.proxy_url}
                      onChange={(e) =>
                        updateNetworkSettings({ proxy_url: e.target.value })
                      }
                      placeholder="例如: http://127.0.0.1:7890 或 socks5://127.0.0.1:7890"
                      className="w-full font-mono text-xs px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-2xs"
                    />
                  </div>

                  {/* 快捷端口标签 */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] text-slate-400 font-medium">常用本地端口快捷填入:</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateNetworkSettings({ proxy_url: "http://127.0.0.1:7890" })
                      }
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
                    >
                      Clash / Mihomo: 7890
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateNetworkSettings({ proxy_url: "http://127.0.0.1:10809" })
                      }
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
                    >
                      v2rayN / Xray: 10809
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateNetworkSettings({ proxy_url: "socks5://127.0.0.1:7890" })
                      }
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
                    >
                      SOCKS5: 7890
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateNetworkSettings({ proxy_url: "http://127.0.0.1:1080" })
                      }
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-cyan-400 text-[11px] text-slate-600 font-mono transition-all cursor-pointer shadow-2xs"
                    >
                      Shadowsocks: 1080
                    </button>
                  </div>
                </div>
              )}

              {/* 连通性测试区 */}
              <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    <Activity className="w-3.5 h-3.5 text-cyan-600" />
                    <span>网络与代理连通性实时诊断</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={testTarget}
                      onChange={(e) => setTestTarget(e.target.value)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="https://flingtrainer.com">风灵月影官网 (flingtrainer.com)</option>
                      <option value="https://api.github.com">GitHub 官方 API (api.github.com)</option>
                      <option value="https://store.steampowered.com">Steam 商店 API (steampowered.com)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleTestNetwork()}
                      disabled={isTestingNetwork}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isTestingNetwork ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>测试中...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>测试连通性</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 测速结果徽章展示 */}
                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      testResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-medium">{testResult.message}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>响应耗时: <strong>{testResult.latency_ms} ms</strong></span>
                      {testResult.status_code && <span>状态码: HTTP {testResult.status_code}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 卡片 2: 更新源与 GitHub 镜像加速 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Zap className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    更新源与海外镜像加速
                  </h2>
                  <p className="text-xs text-slate-400">
                    解决国内网络直接访问 GitHub 慢、连接重置或更新检测超时的问题
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 官方源 */}
                <div
                  onClick={() => updateNetworkSettings({ update_source: "official" })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    network.update_source === "official"
                      ? "border-cyan-500 bg-cyan-50/40 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">GitHub 官方源 (直连)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      国际直连
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    直接连接 GitHub 官方节点，适合有稳定海外网络或开启全局代理的玩家
                  </p>
                </div>

                {/* ghproxy 免翻加速 */}
                <div
                  onClick={() => updateNetworkSettings({ update_source: "ghproxy" })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    network.update_source === "ghproxy"
                      ? "border-cyan-500 bg-cyan-50/40 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-900">国内免翻镜像 (推荐✨)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-semibold">
                      高速反代
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    通过 ghproxy 极速 CDN 节点拉取，国内无需开启科学上网即可秒级检测与下载
                  </p>
                </div>

                {/* 备用镜像通道 */}
                <div
                  onClick={() => updateNetworkSettings({ update_source: "mirror2" })}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    network.update_source === "mirror2"
                      ? "border-cyan-500 bg-cyan-50/40 shadow-xs"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">国内镜像备用节点</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      多线容灾
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    提供多节点负载均衡备用线路，当主镜像节点临时维护时自动平稳回退
                  </p>
                </div>
              </div>
            </div>

            {/* 卡片 3: Steam 官方海报 CDN 加速 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <Layers className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Steam 封面图片 CDN 镜像加速
                  </h2>
                  <p className="text-xs text-slate-400">
                    针对国内部分运营商 DNS 污染导致的 Steam 游戏海报无法加载与“红叉”裂图进行智能路由
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* 开关行 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      启用 Steam 封面 CDN 智能加速 (建议开启⚠️)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      自动将 Steam 官方海报图片路由至国内高可用 CDN 边缘分发节点
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateNetworkSettings({
                        enable_steam_cdn: !network.enable_steam_cdn,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      network.enable_steam_cdn ? "bg-cyan-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        network.enable_steam_cdn ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* CDN 域名路线选择 */}
                {network.enable_steam_cdn && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-700">CDN 边缘加速线路选择</span>
                      <p className="text-[11px] text-slate-400">若某种线路偶尔加载缓慢可切换到另一条</p>
                    </div>
                    <select
                      value={network.steam_cdn_host}
                      onChange={(e) =>
                        updateNetworkSettings({ steam_cdn_host: e.target.value })
                      }
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
                    >
                      <option value="shared.cloudflare.steamstatic.com">Cloudflare 全球极速分发节点</option>
                      <option value="cdn.akamai.steamstatic.com">Akamai 国内高可用节点</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 卡片 4: 网络超时与容错微调 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                  <Activity className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    网络超时与重试容错
                  </h2>
                  <p className="text-xs text-slate-400">
                    针对不同网络环境或高延迟代理进行精细调优，提升抓取与建档成功率
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 超时滑块 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">网络请求超时上限</span>
                    <span className="text-xs font-bold text-cyan-700 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      {(network.timeout_ms / 1000).toFixed(0)} 秒 ({network.timeout_ms}ms)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="30000"
                    step="1000"
                    value={network.timeout_ms}
                    onChange={(e) =>
                      updateNetworkSettings({ timeout_ms: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>3 秒 (快速响应)</span>
                    <span>默认 8 秒</span>
                    <span>30 秒 (弱网宽容)</span>
                  </div>
                </div>

                {/* 重试滑块 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">失败自动重试次数</span>
                    <span className="text-xs font-bold text-cyan-700 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                      {network.max_retry_count} 次
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={network.max_retry_count}
                    onChange={(e) =>
                      updateNetworkSettings({ max_retry_count: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0 次 (不重试)</span>
                    <span>默认 2 次</span>
                    <span>5 次 (极限重试)</span>
                  </div>
                </div>
              </div>

              {/* 恢复网络设置默认按钮 */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  若改错配置导致断网，可随时一键恢复出厂网络设置
                </span>
                <button
                  type="button"
                  onClick={handleResetNetwork}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>恢复网络设置为默认</span>
                </button>
              </div>
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

      {/* 修改器存储目录无损迁移弹窗 */}
      {showMigrateModal && migrateTargetDir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    修改器存储路径迁移向导
                  </h3>
                  <p className="text-xs text-slate-400">
                    检测到您指定了新的根目录，请选择接下来的处理方案喵~
                  </p>
                </div>
              </div>
              {!isMigrating && (
                <button
                  onClick={() => {
                    setShowMigrateModal(false);
                    setMigrateTargetDir(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  取消
                </button>
              )}
            </div>

            {/* 路径迁移流向卡片 */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span>路径变更流向</span>
                <span className="text-cyan-700 font-semibold">
                  共 {storageStats?.trainers_count ?? 0} 款已安装修改器 · 约 {formatBytes(storageStats?.total_size_bytes || 0)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                    当前原路径
                  </div>
                  <div className="font-mono text-xs text-slate-700 truncate" title={storageStats?.trainers_dir || ""}>
                    {storageStats?.trainers_dir || "默认应用数据目录"}
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-cyan-600">
                  <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center shadow-xs">
                    <MoveRight className="w-3.5 h-3.5 rotate-90 sm:rotate-0" />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-200">
                  <div className="text-[10px] text-cyan-600 font-semibold uppercase tracking-wider mb-0.5">
                    迁往新目标路径
                  </div>
                  <div className="font-mono text-xs text-cyan-950 font-medium truncate" title={migrateTargetDir}>
                    {migrateTargetDir}
                  </div>
                </div>
              </div>
            </div>

            {/* 迁移提示说明 */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 space-y-1 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>无损搬家安全保障说明：</span>
              </div>
              <p className="text-[11px] text-amber-700 pl-5">
                • <strong>一键无损搬家</strong>：自动把现有修改器文件夹完整剪切至新盘符，并更新所有内置路径索引与封面，已有数据绝不丢失！<br />
                • <strong>仅切换路径</strong>：仅保存新目录作为未来下载/导入位置，原修改器仍保留在老目录。
              </p>
            </div>

            {/* 底部按钮栏 */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              {!isMigrating && (
                <button
                  onClick={() => {
                    setShowMigrateModal(false);
                    setMigrateTargetDir(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-all"
                >
                  取消
                </button>
              )}

              <button
                onClick={handleSwitchPathOnly}
                disabled={isMigrating}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                仅切换路径
              </button>

              <button
                onClick={handleStartMigration}
                disabled={isMigrating}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>正在搬家迁移中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>开始一键无损搬家</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
