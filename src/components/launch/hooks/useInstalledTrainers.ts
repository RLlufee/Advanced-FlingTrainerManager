import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  trainerApi,
  InstalledTrainerRecord,
  TrainerUpdateInfo,
} from "../../../services/trainerApi";
import { useTheme, extractGameMonetHex } from "../../ui/theme";

// 模块级跨切页缓存，保证切换页面 0ms 秒开不白屏
let cachedInstalledTrainers: InstalledTrainerRecord[] = [];
let cachedSelectedId: string | null = null;

interface UseInstalledTrainersProps {
  isActive?: boolean;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function useInstalledTrainers({ isActive, showToast }: UseInstalledTrainersProps) {
  const [trainers, setTrainersState] = useState<InstalledTrainerRecord[]>(() => cachedInstalledTrainers);
  const setTrainers = useCallback(
    (updater: InstalledTrainerRecord[] | ((prev: InstalledTrainerRecord[]) => InstalledTrainerRecord[])) => {
      setTrainersState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        cachedInstalledTrainers = next;
        return next;
      });
    },
    []
  );

  const [selectedId, setSelectedIdState] = useState<string | null>(() => cachedSelectedId);
  const setSelectedId = useCallback((id: string | null) => {
    cachedSelectedId = id;
    setSelectedIdState(id);
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(() => cachedInstalledTrainers.length === 0);
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

  // 莫奈动态主题引擎（用于第三级「游戏取色」）
  const { isDynamic, gameAdaptiveAccent, applyEphemeralGameAccent } = useTheme();

  // 保持 selectedId 随时可通过 Ref 读取，切断 loadTrainers 对 selectedId 状态变化的依赖联动
  const selectedIdRef = useRef<string | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // 加载已安装列表（函数引用稳定，不再随 selectedId 变动而重建）
  const loadTrainers = useCallback(
    async (keepSelectedId?: string) => {
      if (cachedInstalledTrainers.length === 0) {
        setIsLoading(true);
      }
      try {
        const records = await trainerApi.getInstalledTrainers();
        setTrainers(records);
        const targetId = keepSelectedId ?? selectedIdRef.current ?? cachedSelectedId;
        if (records.length > 0) {
          if (targetId && records.some((r) => r.id === targetId)) {
            setSelectedId(targetId);
          } else {
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
    },
    [setTrainers, setSelectedId, showToast]
  );

  // 合并首次挂载与切页激活为单一路标，杜绝并发双读与 selectedId 变动导致的冗余全盘 I/O
  const isFirstMountRef = useRef(true);
  const prevIsActiveRef = useRef(isActive);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      // 首次挂载：只要当前不是处于后台失活态（undefined 或 true），就只发起一次读取
      if (isActive !== false) {
        loadTrainers();
      }
      return;
    }

    // 后续仅当从“非激活”切换为“激活”时，才进行静默重新校验刷新
    if (!prevIsActiveRef.current && isActive) {
      loadTrainers();
    }
    prevIsActiveRef.current = isActive;
  }, [isActive, loadTrainers]);

  // 当前选中的修改器对象
  const selectedTrainer = useMemo(() => {
    return trainers.find((t) => t.id === selectedId) || null;
  }, [trainers, selectedId]);

  // 当前选中修改器的版本更新检测信息
  const selectedUpdate = useMemo(() => {
    return selectedTrainer ? updateMap[selectedTrainer.id] || null : null;
  }, [selectedTrainer, updateMap]);

  // 莫奈「游戏取色」实时联动
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

  // 手动检测已安装修改器版本更新
  const handleCheckUpdates = useCallback(async () => {
    if (isCheckingUpdate || trainers.length === 0) return;
    setIsCheckingUpdate(true);
    showToast("info", "正在连接风灵月影官网比对最新版本元数据喵...");
    try {
      const results = await trainerApi.checkTrainersUpdate();
      const map: Record<string, TrainerUpdateInfo> = {};
      let updateCount = 0;
      let failedCount = 0;
      for (const r of results) {
        map[r.id] = r;
        if (r.has_update) updateCount++;
        if (r.check_status === "failed") failedCount++;
      }
      setUpdateMap(map);
      if (failedCount === results.length && results.length > 0) {
        showToast("error", "检测更新失败：无法连接官网获取最新版本信息喵...");
      } else if (updateCount > 0) {
        const failNotice = failedCount > 0 ? ` (另有 ${failedCount} 款检测失败)` : "";
        showToast("success", `🎉 检测完毕！发现 ${updateCount} 款修改器有新版本可用喵~${failNotice}`);
      } else if (failedCount > 0) {
        showToast("info", `检测完成，已知修改器为最新版，但有 ${failedCount} 款由于网络未能成功核对喵~`);
      } else {
        showToast("success", "检测完毕！您安装的所有修改器均已是官网最新版本喵~");
      }
    } catch (e) {
      showToast("error", `检测修改器更新失败: ${e}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [isCheckingUpdate, showToast, trainers.length]);

  // 一键升级指定修改器
  const handleUpdateTrainer = useCallback(
    async (id: string) => {
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
    },
    [loadTrainers, showToast, updatingId]
  );

  // 扫描并批量导入外部已有修改器
  const handleImportExternalTrainers = useCallback(async () => {
    if (isImporting) return;
    try {
      const selectedPath = await trainerApi.pickExternalFolder();
      if (!selectedPath) return;

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
  }, [isImporting, loadTrainers, showToast]);

  // 联网补全指定修改器的官方功能看板与高清海报
  const handleEnrichTrainer = useCallback(
    async (id: string) => {
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
    },
    [isEnriching, loadTrainers, showToast]
  );

  // 一键并发补全所有缺失修改器的官方功能与封面
  const handleEnrichAll = useCallback(async () => {
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
  }, [isEnriching, loadTrainers, selectedId, showToast]);

  // 启动修改器
  const handleLaunchTrainer = useCallback(async () => {
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
  }, [loadTrainers, selectedTrainer, showToast]);

  // 一键双启（游戏 + 修改器）
  const handleLaunchDual = useCallback(async () => {
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
  }, [loadTrainers, selectedTrainer, showToast]);

  // 仅唤醒 Steam 游戏
  const handleLaunchSteamOnly = useCallback(async () => {
    if (!selectedTrainer?.steam_app_id) return;
    try {
      await trainerApi.launchSteamGame(selectedTrainer.steam_app_id);
      showToast("success", "已向 Steam 发送游戏启动指令！");
    } catch (e) {
      showToast("error", `调起 Steam 失败: ${e}`);
    }
  }, [selectedTrainer?.steam_app_id, showToast]);

  // 打开所在目录
  const handleOpenInstallDir = useCallback(async () => {
    if (!selectedTrainer?.install_dir) return;
    try {
      await trainerApi.openInstallDir(selectedTrainer.install_dir);
    } catch (e) {
      showToast("error", `打开文件夹失败: ${e}`);
    }
  }, [selectedTrainer?.install_dir, showToast]);

  // 打开 trainers 根目录
  const handleOpenTrainersRoot = useCallback(async () => {
    try {
      await trainerApi.openTrainersRoot();
    } catch (e) {
      showToast("error", `打开 trainers 根目录失败: ${e}`);
    }
  }, [showToast]);

  // 彻底删除修改器
  const handleDeleteTrainer = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await trainerApi.deleteInstalledTrainer(deleteConfirmId);
      showToast("info", "已成功删除该修改器文件夹与全部数据");
      setDeleteConfirmId(null);
      await loadTrainers();
    } catch (e) {
      showToast("error", `删除修改器失败: ${e}`);
    }
  }, [deleteConfirmId, loadTrainers, showToast]);

  return {
    trainers,
    setTrainers,
    selectedId,
    setSelectedId,
    selectedTrainer,
    selectedUpdate,
    isLoading,
    isLaunching,
    searchQuery,
    setSearchQuery,
    filteredTrainers,
    updateMap,
    isCheckingUpdate,
    updatingId,
    isImporting,
    isEnriching,
    deleteConfirmId,
    setDeleteConfirmId,
    loadTrainers,
    handleCheckUpdates,
    handleUpdateTrainer,
    handleImportExternalTrainers,
    handleEnrichTrainer,
    handleEnrichAll,
    handleLaunchTrainer,
    handleLaunchDual,
    handleLaunchSteamOnly,
    handleOpenInstallDir,
    handleOpenTrainersRoot,
    handleDeleteTrainer,
  };
}
