import React, { useState, useEffect } from "react";
import {
  configApi,
  AppConfig,
  HotkeySettings,
  ManagementSettings,
  NetworkSettings,
  NetworkTestResult,
  StorageStats,
} from "../../services/configApi";
import { trainerApi } from "../../services/trainerApi";
import { SettingsSidebar, SettingsTab } from "./SettingsSidebar";
import { HotkeyTab } from "./HotkeyTab";
import { ManagementTab } from "./ManagementTab";
import { NetworkTab } from "./NetworkTab";
import {
  ExportPresetModal,
  ImportPresetModal,
  ClearPresetsConfirmModal,
  MigrationModal,
} from "./SettingsModals";

export interface SettingsViewProps {
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
        正在读取配置...
      </div>
    );
  }

  const hotkey = config?.hotkey;
  const management = config?.management;
  const network = config?.network;

  return (
    <div className="flex h-full w-full bg-[#edf0f5] text-slate-800 select-none overflow-hidden relative">
      {/* 顶部轻量浮动 Toast */}
      {toast && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 border ${
            toast.type === "success"
              ? "bg-emerald-500/90 text-white border-emerald-400/50"
              : toast.type === "error"
              ? "bg-rose-500/90 text-white border-rose-400/50"
              : "bg-slate-800/90 text-white border-slate-700/50"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* 侧边设置导航栏 */}
      <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 主体设置面板 */}
      <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {activeTab === "hotkey" && hotkey && (
          <HotkeyTab
            hotkey={hotkey}
            onUpdateHotkey={updateHotkeySettings}
            onExportPresets={handleExportPresets}
            onOpenImportModal={() => {
              setImportInput("");
              setShowImportModal(true);
            }}
            onOpenClearConfirm={() => setShowClearConfirm(true)}
          />
        )}

        {activeTab === "management" && management && (
          <ManagementTab
            management={management}
            storageStats={storageStats}
            isScanningStorage={isScanningStorage}
            isCleaningCache={isCleaningCache}
            onUpdateManagement={updateManagementSettings}
            onLoadStorageStats={loadStorageStats}
            onPickNewDirectory={handlePickNewDirectory}
            onOpenCurrentTrainersDir={handleOpenCurrentTrainersDir}
            onCleanCache={handleCleanCache}
            onToggleStartup={handleToggleStartup}
            formatBytes={formatBytes}
          />
        )}

        {activeTab === "network" && network && (
          <NetworkTab
            network={network}
            testResult={testResult}
            isTestingNetwork={isTestingNetwork}
            testTarget={testTarget}
            onUpdateNetwork={updateNetworkSettings}
            onTestNetwork={() => handleTestNetwork(testTarget)}
            onTestTargetChange={setTestTarget}
            onResetNetwork={handleResetNetwork}
          />
        )}
      </main>

      {/* 模态弹窗群 */}
      <ExportPresetModal
        exportJson={exportJson}
        onClose={() => setExportJson(null)}
        onCopy={handleCopyExportJson}
        isCopied={isCopied}
      />

      <ImportPresetModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        input={importInput}
        setInput={setImportInput}
        onImport={handleImportPresets}
      />

      <ClearPresetsConfirmModal
        show={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAllPresets}
      />

      <MigrationModal
        show={showMigrateModal}
        targetDir={migrateTargetDir}
        storageStats={storageStats}
        isMigrating={isMigrating}
        onClose={() => {
          setShowMigrateModal(false);
          setMigrateTargetDir(null);
        }}
        onSwitchPathOnly={handleSwitchPathOnly}
        onStartMigration={handleStartMigration}
        formatBytes={formatBytes}
      />
    </div>
  );
};
