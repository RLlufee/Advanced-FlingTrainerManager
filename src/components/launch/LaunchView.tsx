import React, { useState, useEffect, useMemo } from "react";
import { Check, AlertCircle, Sparkles } from "lucide-react";
import {
  trainerApi,
  InstalledTrainerRecord,
  TrainerOptionItem,
  TrainerUpdateInfo,
} from "../../services/trainerApi";
import {
  matchHotkey,
  translateHotkeyTitle,
  formatAllHotkeys,
  extractHotkey,
  isToggleableOption,
} from "../../lib/hotkeyTranslate";
import { LaunchSidebar } from "./LaunchSidebar";
import { LaunchHero } from "./LaunchHero";
import { HotkeyPanel } from "./HotkeyPanel";
import { LaunchEmptyState } from "./LaunchEmptyState";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { useTheme, extractGameMonetHex } from "../ui/theme";

export interface LaunchViewProps {
  onNavigateToDownload?: () => void;
  isActive?: boolean;
}

export const LaunchView: React.FC<LaunchViewProps> = ({
  onNavigateToDownload,
  isActive,
}) => {
  const [trainers, setTrainers] = useState<InstalledTrainerRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hotkeyQuery, setHotkeyQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 版本检测与一键增量更新状态
  const [updateMap, setUpdateMap] = useState<Record<string, TrainerUpdateInfo>>({});
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 外部已有修改器批量扫描导入状态
  const [isImporting, setIsImporting] = useState<boolean>(false);
  // 联网补全修改器官方功能看板与封面状态
  const [isEnriching, setIsEnriching] = useState<boolean>(false);

  // 复制反馈与状态提示
  const [copiedKeyIdx, setCopiedKeyIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // 修改器预设开关状态字典
  const [currentToggles, setCurrentToggles] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 莫奈动态主题引擎（用于第三级「游戏取色」：选中修改器实时提取封面代表色）
  const { isDynamic, gameAdaptiveAccent, applyEphemeralGameAccent } = useTheme();

  // 显示临时通知
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // 加载已安装列表
  const loadTrainers = async (keepSelectedId?: string) => {
    setIsLoading(true);
    try {
      const records = await trainerApi.getInstalledTrainers();
      setTrainers(records);
      if (records.length > 0) {
        if (keepSelectedId && records.some((r) => r.id === keepSelectedId)) {
          setSelectedId(keepSelectedId);
        } else if (!selectedId || !records.some((r) => r.id === selectedId)) {
          setSelectedId(records[0].id);
        }
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      showToast("error", `读取本地修改器失败: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  // 当用户从其他 Tab 切换回启动页时，自动静默刷新已安装列表
  useEffect(() => {
    if (isActive) {
      loadTrainers(selectedId || undefined);
    }
  }, [isActive]);

  // 当前选中的修改器对象
  const selectedTrainer = useMemo(() => {
    return trainers.find((t) => t.id === selectedId) || null;
  }, [trainers, selectedId]);

  // 当前选中修改器的版本更新检测信息
  const selectedUpdate = useMemo(() => {
    return selectedTrainer ? updateMap[selectedTrainer.id] || null : null;
  }, [selectedTrainer, updateMap]);

  // 当选中的修改器切换时，同步加载其 saved_toggles
  useEffect(() => {
    if (selectedTrainer) {
      setCurrentToggles(selectedTrainer.saved_toggles || {});
    } else {
      setCurrentToggles({});
    }
  }, [selectedTrainer?.id]);

  // 莫奈「游戏取色」实时联动：仅在处于启动页激活态且开启了动态游戏取色时触发（纯内存瞬态，0 写盘）
  useEffect(() => {
    if (!isDynamic || !gameAdaptiveAccent) return;
    if (!isActive) return;

    if (!selectedTrainer) {
      applyEphemeralGameAccent(null);
      return;
    }

    let cancelled = false;
    const displayName = selectedTrainer.chinese_name || selectedTrainer.name;

    extractGameMonetHex(selectedTrainer.id, displayName, [
      selectedTrainer.capsule_image,
      selectedTrainer.hero_image,
      selectedTrainer.thumbnail,
    ]).then((seedHex) => {
      if (!cancelled) {
        applyEphemeralGameAccent({
          trainerId: selectedTrainer.id,
          trainerName: displayName,
          hex: seedHex,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    isActive,
    isDynamic,
    gameAdaptiveAccent,
    selectedTrainer?.id,
    selectedTrainer?.capsule_image,
    selectedTrainer?.hero_image,
    selectedTrainer?.thumbnail,
    selectedTrainer?.chinese_name,
    selectedTrainer?.name,
    applyEphemeralGameAccent,
  ]);

  // 左侧已安装游戏过滤
  const filteredTrainers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(q);
      const cnMatch = (t.chinese_name || "").toLowerCase().includes(q);
      const verMatch = t.version.toLowerCase().includes(q);
      return nameMatch || cnMatch || verMatch;
    });
  }, [trainers, searchQuery]);

  // 当前选中修改器的热键项规范化
  const activeOptionItems = useMemo<TrainerOptionItem[]>(() => {
    if (!selectedTrainer) return [];
    if (
      selectedTrainer.option_items &&
      Array.isArray(selectedTrainer.option_items) &&
      selectedTrainer.option_items.length > 0
    ) {
      return selectedTrainer.option_items.filter(Boolean).map((item) => {
        if (typeof item === "string") {
          return { title: item, note: null };
        }
        return {
          title: item.title || "",
          note: item.note || null,
        };
      });
    }
    if (
      selectedTrainer.options &&
      Array.isArray(selectedTrainer.options) &&
      selectedTrainer.options.length > 0
    ) {
      return selectedTrainer.options.filter(Boolean).map((title) => ({
        title: typeof title === "string" ? title : String(title),
        note: null,
      }));
    }
    return [];
  }, [selectedTrainer]);

  // 过滤后的热键看板列表
  const filteredHotkeys = useMemo(() => {
    if (!hotkeyQuery.trim()) return activeOptionItems;
    return activeOptionItems.filter((item) =>
      matchHotkey(item.title, item.note, hotkeyQuery)
    );
  }, [activeOptionItems, hotkeyQuery]);

  // 统计当前已开启的开关数量
  const enabledTogglesCount = useMemo(() => {
    return Object.values(currentToggles).filter(Boolean).length;
  }, [currentToggles]);

  // 单项开关切换
  const handleToggleOption = async (title: string) => {
    if (!selectedTrainer) return;
    const nextVal = !currentToggles[title];
    const newToggles = {
      ...currentToggles,
      [title]: nextVal,
    };
    setCurrentToggles(newToggles);

    try {
      await trainerApi.saveTrainerToggles(selectedTrainer.id, newToggles);
      setTrainers((prev) =>
        prev.map((t) =>
          t.id === selectedTrainer.id ? { ...t, saved_toggles: newToggles } : t
        )
      );
    } catch (e) {
      showToast("error", `保存开关状态失败: ${e}`);
    }
  };

  // 全开 / 清空开关预设
  const handleToggleAll = async (enableAll: boolean) => {
    if (!selectedTrainer) return;
    const newToggles: Record<string, boolean> = {};
    if (enableAll) {
      activeOptionItems.forEach((item) => {
        if (isToggleableOption(item.title, item.note)) {
          newToggles[item.title] = true;
        }
      });
    }
    setCurrentToggles(newToggles);

    try {
      await trainerApi.saveTrainerToggles(selectedTrainer.id, newToggles);
      setTrainers((prev) =>
        prev.map((t) =>
          t.id === selectedTrainer.id ? { ...t, saved_toggles: newToggles } : t
        )
      );
      showToast(
        "info",
        enableAll
          ? "已将所有二元开关项设为开启预设喵~"
          : "已清空当前修改器的全部开启预设"
      );
    } catch (e) {
      showToast("error", `批量更新预设失败: ${e}`);
    }
  };

  // 一键同步预设热键模拟 (自动模拟键盘按键)
  const handleSyncHotkeys = async () => {
    if (!selectedTrainer || isSyncing) return;
    const enabledTitles = Object.keys(currentToggles).filter(
      (title) => currentToggles[title]
    );

    if (enabledTitles.length === 0) {
      showToast(
        "info",
        "笨蛋主人，你还没打开任何功能的开关呢喵！先在下方开启几个想要的功能吧~"
      );
      return;
    }

    setIsSyncing(true);
    try {
      const hotkeysToSend = enabledTitles.map((t) => extractHotkey(t));
      const count = await trainerApi.syncTrainerHotkeys(
        selectedTrainer.id,
        hotkeysToSend
      );
      showToast(
        "success",
        `⚡ 模拟按键完成！已成功为您同步激活 ${count} 项预设功能喵~`
      );
    } catch (e) {
      showToast("error", `模拟热键同步失败: ${e}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 手动检测已安装修改器版本更新
  const handleCheckUpdates = async () => {
    if (isCheckingUpdate || trainers.length === 0) return;
    setIsCheckingUpdate(true);
    showToast("info", "正在连接风灵月影官网比对最新版本元数据喵...");
    try {
      const results = await trainerApi.checkTrainersUpdate();
      const map: Record<string, TrainerUpdateInfo> = {};
      let updateCount = 0;
      for (const r of results) {
        map[r.id] = r;
        if (r.has_update) updateCount++;
      }
      setUpdateMap(map);
      if (updateCount > 0) {
        showToast("success", `🎉 检测完毕！发现 ${updateCount} 款修改器有新版本可用喵~`);
      } else {
        showToast("success", "检测完毕！您安装的所有修改器均已是官网最新版本喵~");
      }
    } catch (e) {
      showToast("error", `检测修改器更新失败: ${e}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // 一键无感增量升级指定修改器
  const handleUpdateTrainer = async (id: string) => {
    if (updatingId) return;
    setUpdatingId(id);
    showToast("info", "开始下载新版修改器，所有配置与开关预设将自动完整继承喵...");
    try {
      await trainerApi.updateTrainerToLatest(id);
      await loadTrainers(id);
      setUpdateMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showToast("success", "🎉 修改器已成功升级到最新版！所有开关预设已原封不动保留喵~");
    } catch (e) {
      showToast("error", `更新修改器失败: ${e}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // 扫描并批量导入外部已有修改器
  const handleImportExternalTrainers = async () => {
    if (isImporting) return;
    try {
      const selectedPath = await trainerApi.pickExternalFolder();
      if (!selectedPath) return; // 玩家取消或未选目录

      setIsImporting(true);
      showToast(
        "info",
        `正在扫描并联网匹配 Steam 封面与元数据: ${selectedPath}，请稍候喵...`
      );

      const summary = await trainerApi.scanAndImportTrainers(selectedPath);
      await loadTrainers();

      if (summary.imported_count > 0) {
        showToast(
          "success",
          `🎉 扫描导入大成功！共检查 ${summary.total_scanned} 个文件，成功收纳建档 ${summary.imported_count} 款修改器喵~`
        );
      } else {
        showToast(
          "info",
          `扫描完毕，目标文件夹中未发现新的有效修改器（已跳过 ${summary.skipped_count} 项）喵~`
        );
      }
    } catch (e) {
      showToast("error", `扫描导入外部修改器失败: ${e}`);
    } finally {
      setIsImporting(false);
    }
  };

  // 联网补全指定修改器的官方功能看板与高清海报
  const handleEnrichTrainer = async (id: string) => {
    if (isEnriching) return;
    setIsEnriching(true);
    showToast("info", "正在联网匹配风灵月影官方功能看板与高清海报喵...");
    try {
      const updated = await trainerApi.enrichInstalledTrainer(id);
      showToast(
        "success",
        `已成功同步《${updated.chinese_name || updated.name}》的全部功能与封面喵~`
      );
      await loadTrainers(id);
    } catch (e) {
      showToast("error", `同步官方数据失败: ${e}`);
    } finally {
      setIsEnriching(false);
    }
  };

  // 一键并发补全所有缺失修改器的官方功能与封面
  const handleEnrichAll = async () => {
    if (isEnriching) return;
    setIsEnriching(true);
    showToast(
      "info",
      "正在全量匹配补齐所有缺失修改器的官方功能与封面，请稍候喵..."
    );
    try {
      const res = await trainerApi.enrichAllInstalledTrainers();
      if (res.attempted === 0) {
        showToast("info", "所有修改器的数据均已是完整状态喵~");
      } else if (res.failed > 0) {
        showToast(
          res.succeeded > 0 ? "success" : "error",
          `补全处理完成：成功 ${res.succeeded} 款，${res.failed} 款因网络超时或未匹配失败喵~`
        );
      } else {
        showToast(
          "success",
          `🎉 补全大成功！已为全部 ${res.succeeded} 款修改器同步官方功能看板与高清海报喵~`
        );
      }
      await loadTrainers(selectedId || undefined);
    } catch (e) {
      showToast("error", `全量同步数据失败: ${e}`);
    } finally {
      setIsEnriching(false);
    }
  };

  // 启动修改器
  const handleLaunchTrainer = async () => {
    if (!selectedTrainer) return;
    setIsLaunching(true);
    try {
      const msg = await trainerApi.launchTrainer(selectedTrainer.id);
      showToast("success", msg);
      await loadTrainers(selectedTrainer.id);
    } catch (e) {
      showToast("error", `启动修改器失败: ${e}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // 一键双启（游戏 + 修改器）
  const handleLaunchDual = async () => {
    if (!selectedTrainer) return;
    setIsLaunching(true);
    try {
      const msg = await trainerApi.launchGameAndTrainer(
        selectedTrainer.id,
        selectedTrainer.steam_app_id
      );
      showToast("success", `已唤醒 Steam 游戏并${msg}`);
      await loadTrainers(selectedTrainer.id);
    } catch (e) {
      showToast("error", `一键双启失败: ${e}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // 仅唤醒 Steam 游戏
  const handleLaunchSteamOnly = async () => {
    if (!selectedTrainer?.steam_app_id) return;
    try {
      await trainerApi.launchSteamGame(selectedTrainer.steam_app_id);
      showToast("success", "已向 Steam 发送游戏启动指令！");
    } catch (e) {
      showToast("error", `调起 Steam 失败: ${e}`);
    }
  };

  // 打开所在目录
  const handleOpenInstallDir = async () => {
    if (!selectedTrainer?.install_dir) return;
    try {
      await trainerApi.openInstallDir(selectedTrainer.install_dir);
    } catch (e) {
      showToast("error", `打开文件夹失败: ${e}`);
    }
  };

  // 打开 trainers 根目录
  const handleOpenTrainersRoot = async () => {
    try {
      await trainerApi.openTrainersRoot();
    } catch (e) {
      showToast("error", `打开 trainers 根目录失败: ${e}`);
    }
  };

  // 彻底删除修改器
  const handleDeleteTrainer = async () => {
    if (!deleteConfirmId) return;
    try {
      await trainerApi.deleteInstalledTrainer(deleteConfirmId);
      showToast("info", "已成功删除该修改器文件夹与全部数据");
      setDeleteConfirmId(null);
      await loadTrainers();
    } catch (e) {
      showToast("error", `删除修改器失败: ${e}`);
    }
  };

  // 单项复制热键
  const handleCopySingle = async (
    title: string,
    note: string | null,
    index: number
  ) => {
    const cn = translateHotkeyTitle(title);
    const text = cn
      ? `${title} [${cn}]${note ? ` (${note})` : ""}`
      : `${title}${note ? ` (${note})` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKeyIdx(index);
      setTimeout(() => setCopiedKeyIdx(null), 1800);
    } catch {
      showToast("error", "写入系统剪贴板失败");
    }
  };

  // 一键复制全部热键
  const handleCopyAll = async () => {
    if (activeOptionItems.length === 0) return;
    try {
      const text = formatAllHotkeys(activeOptionItems);
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      showToast("success", `已复制全部 ${activeOptionItems.length} 项热键说明！`);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showToast("error", "写入剪贴板失败");
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative select-none">
      {/* 浮动状态 Toast 提示 */}
      {toast && (
        <div className="absolute top-4 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md border ${
              toast.type === "success"
                ? "bg-emerald-950/85 text-emerald-300 border-emerald-500/40"
                : toast.type === "error"
                ? "bg-rose-950/85 text-rose-300 border-rose-500/40"
                : "bg-cyan-900/95 text-cyan-200 border-cyan-500/40 shadow-primary-glow"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-cyan-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        show={Boolean(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteTrainer}
      />

      {/* 左侧白色边栏 */}
      <LaunchSidebar
        trainers={trainers}
        filteredTrainers={filteredTrainers}
        selectedId={selectedId}
        searchQuery={searchQuery}
        updateMap={updateMap}
        isImporting={isImporting}
        isCheckingUpdate={isCheckingUpdate}
        isEnriching={isEnriching}
        isLoading={isLoading}
        onSelectTrainer={setSelectedId}
        onSearchQueryChange={setSearchQuery}
        onImportExternal={handleImportExternalTrainers}
        onCheckUpdates={handleCheckUpdates}
        onEnrichAll={handleEnrichAll}
        onRefresh={() => loadTrainers(selectedId || undefined)}
        onOpenTrainersRoot={handleOpenTrainersRoot}
        onNavigateToDownload={onNavigateToDownload}
      />

      {/* 右侧工作区视口 */}
      <main className="wallpaper-shell flex-1 flex flex-col overflow-y-auto transition-colors duration-300">
        {!selectedTrainer ? (
          <LaunchEmptyState
            isImporting={isImporting}
            onImportExternal={handleImportExternalTrainers}
            onNavigateToDownload={onNavigateToDownload}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <LaunchHero
              trainer={selectedTrainer}
              updateInfo={selectedUpdate}
              isLaunching={isLaunching}
              isEnriching={isEnriching}
              updatingId={updatingId}
              activeOptionCount={activeOptionItems.length}
              onLaunchTrainer={handleLaunchTrainer}
              onLaunchDual={handleLaunchDual}
              onLaunchSteamOnly={handleLaunchSteamOnly}
              onEnrichTrainer={() => handleEnrichTrainer(selectedTrainer.id)}
              onUpdateTrainer={() => handleUpdateTrainer(selectedTrainer.id)}
              onOpenInstallDir={handleOpenInstallDir}
              onDeleteClick={() => setDeleteConfirmId(selectedTrainer.id)}
            />

            <HotkeyPanel
              trainer={selectedTrainer}
              activeOptionItems={activeOptionItems}
              filteredHotkeys={filteredHotkeys}
              hotkeyQuery={hotkeyQuery}
              currentToggles={currentToggles}
              enabledTogglesCount={enabledTogglesCount}
              isSyncing={isSyncing}
              isEnriching={isEnriching}
              copiedKeyIdx={copiedKeyIdx}
              copiedAll={copiedAll}
              onHotkeyQueryChange={setHotkeyQuery}
              onSyncHotkeys={handleSyncHotkeys}
              onToggleAll={handleToggleAll}
              onCopyAll={handleCopyAll}
              onCopySingle={handleCopySingle}
              onToggleOption={handleToggleOption}
              onEnrichTrainer={() => handleEnrichTrainer(selectedTrainer.id)}
            />
          </div>
        )}
      </main>
    </div>
  );
};
