import React, { useState, useEffect, useMemo } from "react";
import {
  Gamepad2,
  Zap,
  Play,
  FolderOpen,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Sliders,
  Clock,
  Trash2,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  FileText,
  FolderTree,
  PlusCircle,
  X,
  Radio,
  ArrowUpCircle,
  FolderInput,
} from "lucide-react";
import {
  trainerApi,
  InstalledTrainerRecord,
  TrainerOptionItem,
  TrainerUpdateInfo,
} from "../services/trainerApi";
import { GamePoster } from "./GamePoster";
import {
  matchHotkey,
  translateHotkeyTitle,
  formatAllHotkeys,
  extractHotkey,
  isToggleableOption,
} from "../lib/hotkeyTranslate";

interface LaunchViewProps {
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
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

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
    if (selectedTrainer.option_items && Array.isArray(selectedTrainer.option_items) && selectedTrainer.option_items.length > 0) {
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
    if (selectedTrainer.options && Array.isArray(selectedTrainer.options) && selectedTrainer.options.length > 0) {
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

  // 修改器预设开关状态字典
  const [currentToggles, setCurrentToggles] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 当选中的修改器切换时，同步加载其 saved_toggles
  useEffect(() => {
    if (selectedTrainer) {
      setCurrentToggles(selectedTrainer.saved_toggles || {});
    } else {
      setCurrentToggles({});
    }
  }, [selectedTrainer?.id]);

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
      showToast("info", "笨蛋主人，你还没打开任何功能的开关呢喵！先在下方开启几个想要的功能吧~");
      return;
    }

    setIsSyncing(true);
    try {
      const hotkeysToSend = enabledTitles.map((t) => extractHotkey(t));
      const count = await trainerApi.syncTrainerHotkeys(selectedTrainer.id, hotkeysToSend);
      showToast("success", `⚡ 模拟按键完成！已成功为您同步激活 ${count} 项预设功能喵~`);
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
      showToast("info", `正在扫描并联网匹配 Steam 封面与元数据: ${selectedPath}，请稍候喵...`);

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
      showToast("success", `已成功同步《${updated.chinese_name || updated.name}》的全部功能与封面喵~`);
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
    showToast("info", "正在全量匹配补齐所有缺失修改器的官方功能与封面，请稍候喵...");
    try {
      const count = await trainerApi.enrichAllInstalledTrainers();
      if (count > 0) {
        showToast("success", `🎉 补全大成功！已为 ${count} 款修改器同步官方功能看板与高清海报喵~`);
      } else {
        showToast("info", "所有修改器的数据均已是完整状态喵~");
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
      // 重新加载以更新最后启动时间
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
  const handleCopySingle = async (title: string, note: string | null, index: number) => {
    const cn = translateHotkeyTitle(title);
    const text = cn ? `${title} [${cn}]${note ? ` (${note})` : ""}` : `${title}${note ? ` (${note})` : ""}`;
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
                : "bg-slate-900/90 text-cyan-300 border-cyan-500/40"
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
      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-100">确认删除该修改器？</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              这将彻底删除该修改器在 <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">trainers/</code> 目录下的子文件夹、可执行程序及元数据，该操作不可撤销。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteTrainer}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 transition-all"
              >
                彻底删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 左侧白色/浅色拟物面板 (PCL II 风格边栏) */}
      <aside className="w-72 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        {/* 顶部搜索过滤与工具栏 */}
        <div className="p-3 border-b border-slate-100 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索已安装修改器..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              已安装 ({trainers.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleImportExternalTrainers}
                disabled={isImporting}
                title="批量扫描并导入外部已有修改器（自动识别、提取、匹配 Steam 封面并建档）"
                className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <FolderInput className={`w-3.5 h-3.5 ${isImporting ? "animate-bounce text-cyan-600" : ""}`} />
              </button>
              <button
                onClick={handleCheckUpdates}
                disabled={isCheckingUpdate || trainers.length === 0}
                title="联网对比官网，检测是否有最新版本修改器"
                className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Radio className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-pulse text-amber-500" : ""}`} />
              </button>
              <button
                onClick={handleEnrichAll}
                disabled={isEnriching || trainers.length === 0}
                title="一键联网补全所有缺少功能看板或封面的修改器数据"
                className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? "animate-spin text-cyan-600" : ""}`} />
              </button>
              <button
                onClick={() => loadTrainers(selectedId || undefined)}
                title="刷新已安装列表"
                className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
              </button>
              <button
                onClick={handleOpenTrainersRoot}
                title="打开 trainers 便携存储根目录"
                className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 已安装修改器列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTrainers.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-medium">
                {searchQuery ? "未匹配到相关修改器" : "暂未安装任何修改器"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {searchQuery ? "请更换搜索词重试" : "去下载页挑几个喜欢的游戏吧喵~"}
              </p>
            </div>
          ) : (
            filteredTrainers.map((t) => {
              const isSelected = t.id === selectedId;
              const displayName = t.chinese_name || t.name;
              const subName = t.chinese_name ? t.name : null;
              const optionCount = t.option_items?.length || t.options?.length || 0;
              const hasUpdate = updateMap[t.id]?.has_update;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left group ${
                    isSelected
                      ? "bg-slate-100 text-slate-900 font-semibold shadow-xs ring-1 ring-slate-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {/* 微缩海报 */}
                  <div className="w-9 h-11 rounded-md overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100 shadow-2xs">
                    <GamePoster
                      primarySrc={t.capsule_image}
                      secondarySrc={t.thumbnail}
                      alt={displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      showInitials={false}
                    />
                  </div>

                  {/* 游戏名与版本徽章 */}
                  <div className="truncate flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-slate-800 font-semibold text-xs leading-snug">
                        {displayName}
                      </span>
                      {hasUpdate && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-2xs animate-pulse">
                          待更新
                        </span>
                      )}
                    </div>
                    {subName && (
                      <div className="truncate text-[10px] text-slate-400 font-normal">
                        {subName}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-normal">
                      <span className="text-cyan-600 font-medium">{t.version}</span>
                      {optionCount > 0 && (
                        <>
                          <span>·</span>
                          <span>{optionCount} 项功能</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 边栏底部：导入与去下载 */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-1.5">
          <button
            onClick={handleImportExternalTrainers}
            disabled={isImporting}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <FolderInput className={`w-3.5 h-3.5 text-cyan-600 ${isImporting ? "animate-bounce" : ""}`} />
            <span>{isImporting ? "正在扫描纳管中..." : "批量导入已有修改器..."}</span>
          </button>
          {onNavigateToDownload && (
            <button
              onClick={onNavigateToDownload}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/60 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-600" />
              <span>从官网下载更多修改器...</span>
            </button>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
            <span>便携独立存储架构</span>
            <span className="text-cyan-600/80 font-mono">trainers/</span>
          </div>
        </div>
      </aside>

      {/* 右侧工作区视口 */}
      <main className="flex-1 bg-[#edf0f5] flex flex-col overflow-y-auto">
        {!selectedTrainer ? (
          // 空态视口
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center text-cyan-600 mb-4 animate-bounce duration-1000">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">未选择任何修改器</h2>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
              笨蛋主人，这里还没有选中的修改器喵！可以点击下方扫描电脑里已下载的修改器，或者去下载库挑选新游戏吧~
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleImportExternalTrainers}
                disabled={isImporting}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <FolderInput className={`w-4 h-4 text-cyan-600 ${isImporting ? "animate-bounce" : ""}`} />
                <span>{isImporting ? "正在扫描纳管..." : "批量导入已有修改器"}</span>
              </button>
              {onNavigateToDownload && (
                <button
                  onClick={onNavigateToDownload}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-cyan-400" />
                  <span>前往下载库下载修改器</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* 顶部宽幅英雄区 (明亮纯白风格) */}
            <div className="relative overflow-hidden bg-white text-slate-800 border-b border-slate-200/90 shadow-2xs shrink-0">
              {/* 核心内容区 */}
              <div className="relative p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* 封面图与标题 */}
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-md bg-slate-100">
                    <GamePoster
                      primarySrc={selectedTrainer.capsule_image}
                      secondarySrc={selectedTrainer.thumbnail}
                      alt={selectedTrainer.chinese_name || selectedTrainer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">
                        {selectedTrainer.chinese_name || selectedTrainer.name}
                      </h1>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        已就绪
                      </span>
                    </div>

                    {selectedTrainer.chinese_name && (
                      <p className="text-xs text-slate-400 truncate mb-2">
                        {selectedTrainer.name}
                      </p>
                    )}

                    {/* 属性与版本徽章 */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200/80 font-medium">
                        修改器 {selectedTrainer.version}
                      </span>

                      {selectedUpdate?.has_update && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/90 font-semibold flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>发现新版: {selectedUpdate.latest_version}</span>
                        </span>
                      )}

                      {selectedTrainer.game_version && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                          支持游戏: {selectedTrainer.game_version}
                        </span>
                      )}

                      {selectedTrainer.steam_app_id && (
                        <button
                          onClick={() => trainerApi.openSteamStore(selectedTrainer.steam_app_id!)}
                          title="在浏览器中查看 Steam 商店页"
                          className="px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Gamepad2 className="w-3 h-3 text-sky-600" />
                          <span>Steam #{selectedTrainer.steam_app_id}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      )}

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
                        <Clock className="w-3 h-3" />
                        {selectedTrainer.last_launched_at
                          ? `上次启动: ${new Date(selectedTrainer.last_launched_at).toLocaleDateString()}`
                          : "尚未启动过"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 动作按钮矩阵 */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch lg:self-center">
                  {/* 一键获取官方功能与封面数据按钮 */}
                  {activeOptionItems.length === 0 && (
                    <button
                      onClick={() => handleEnrichTrainer(selectedTrainer.id)}
                      disabled={isEnriching}
                      title="联网匹配风灵月影官方所有功能开关、热键说明与官方海报"
                      className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 text-cyan-200 ${isEnriching ? "animate-spin" : ""}`} />
                      <span>{isEnriching ? "正在匹配数据..." : "获取修改器数据"}</span>
                    </button>
                  )}

                  {/* 一键无感增量升级新版本按钮 */}
                  {selectedUpdate?.has_update && (
                    <button
                      onClick={() => handleUpdateTrainer(selectedTrainer.id)}
                      disabled={updatingId === selectedTrainer.id}
                      title={`检测到官网最新版本 ${selectedUpdate.latest_version}，点击一键下载覆盖 exe，保留所有配置与开关预设`}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 animate-pulse"
                    >
                      <ArrowUpCircle className={`w-4 h-4 ${updatingId === selectedTrainer.id ? "animate-spin" : ""}`} />
                      <span>
                        {updatingId === selectedTrainer.id
                          ? "正在升级中..."
                          : `一键升级 (${selectedUpdate.latest_version})`}
                      </span>
                    </button>
                  )}

                  {/* 一键启动修改器大按钮 */}
                  <button
                    onClick={handleLaunchTrainer}
                    disabled={isLaunching}
                    className="flex-1 lg:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>{isLaunching ? "正在启动..." : "启动修改器"}</span>
                  </button>

                  {/* 一键双启 (游戏 + 修改器) */}
                  {selectedTrainer.steam_app_id && (
                    <button
                      onClick={handleLaunchDual}
                      disabled={isLaunching}
                      title="先启动 Steam 游戏，随后自动唤醒修改器"
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>一键双启</span>
                    </button>
                  )}

                  {/* 仅启动 Steam 游戏 */}
                  {selectedTrainer.steam_app_id && (
                    <button
                      onClick={handleLaunchSteamOnly}
                      title="直接唤醒 Steam 客户端启动该游戏"
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>运行游戏</span>
                    </button>
                  )}

                  {/* 打开所在目录 */}
                  <button
                    onClick={handleOpenInstallDir}
                    title="在系统资源管理器中打开当前修改器子目录"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-cyan-600" />
                  </button>

                  {/* 卸载/删除修改器 */}
                  <button
                    onClick={() => setDeleteConfirmId(selectedTrainer.id)}
                    title="删除此修改器及本地文件"
                    className="p-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200/80 active:scale-95 text-slate-400 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 下方核心内容区：功能热键看板 */}
            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              {/* 热键看板标题与状态预设工具栏 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-800">
                        修改器功能热键看板
                      </h2>
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
                        {filteredHotkeys.length} / {activeOptionItems.length} 项
                      </span>
                      {enabledTogglesCount > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                          已预设 {enabledTogglesCount} 项
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      支持记录开关状态并一键模拟按键同步 · 支持中英文同义词搜索
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                  {/* 一键同步预设按钮 */}
                  <button
                    onClick={handleSyncHotkeys}
                    disabled={enabledTogglesCount === 0 || isSyncing}
                    title="在修改器启动后，自动模拟键盘依次开启所有已预设的开关项"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Zap className={`w-3.5 h-3.5 fill-white ${isSyncing ? "animate-bounce" : ""}`} />
                    <span>
                      {isSyncing
                        ? "正在模拟按键同步..."
                        : `一键同步预设 (${enabledTogglesCount})`}
                    </span>
                  </button>

                  {/* 批量全开/清空开关小工具 */}
                  <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200/80 text-[11px] shrink-0">
                    <button
                      onClick={() => handleToggleAll(true)}
                      title="将当前修改器的所有二元开关项全部打开预设"
                      className="px-2 py-1 rounded text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      全开
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleToggleAll(false)}
                      title="清空当前所有开关预设"
                      className="px-2 py-1 rounded text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      清空
                    </button>
                  </div>

                  {/* 热键搜索框 */}
                  <div className="relative flex-1 sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={hotkeyQuery}
                      onChange={(e) => setHotkeyQuery(e.target.value)}
                      placeholder="过滤热键功能..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-slate-700"
                    />
                    {hotkeyQuery && (
                      <button
                        onClick={() => setHotkeyQuery("")}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 一键复制全部热键 */}
                  <button
                    onClick={handleCopyAll}
                    disabled={activeOptionItems.length === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">已复制全部</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>复制清单</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 热键双列卡片展示网格 */}
              {filteredHotkeys.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center text-slate-400 space-y-4">
                  <Sliders className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {hotkeyQuery ? "未找到符合过滤条件的热键" : "该修改器尚未同步官方功能看板与热键说明"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      {hotkeyQuery
                        ? "可以尝试搜索拼音或英文原词（如 HP, Money, God）"
                        : "检测到此修改器缺少结构化热键数据，点击下方按钮即可秒级联网匹配风灵月影官方功能项、按键清单及高清封面海报！"}
                    </p>
                  </div>
                  {!hotkeyQuery && (
                    <button
                      onClick={() => handleEnrichTrainer(selectedTrainer.id)}
                      disabled={isEnriching}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className={`w-4 h-4 text-cyan-200 ${isEnriching ? "animate-spin" : ""}`} />
                      <span>{isEnriching ? "正在匹配风灵月影官方数据..." : "一键获取官方功能看板与封面"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredHotkeys.map((item, idx) => {
                    const cnTag = translateHotkeyTitle(item.title);
                    const isCopied = copiedKeyIdx === idx;
                    const isToggleable = isToggleableOption(item.title, item.note);
                    const isToggled = Boolean(currentToggles[item.title]);

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 shadow-2xs transition-all flex items-start justify-between gap-3 group ${
                          isToggled
                            ? "bg-emerald-50/20 border-emerald-300/80 ring-1 ring-emerald-500/15 shadow-xs"
                            : "bg-white border-slate-200/80 hover:shadow-md hover:border-cyan-300/80"
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-xs font-semibold leading-snug ${isToggled ? "text-emerald-900 font-bold" : "text-slate-800"}`}>
                              {item.title}
                            </span>
                            {cnTag && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${
                                isToggled
                                  ? "bg-emerald-100/70 text-emerald-800 border-emerald-300/70"
                                  : "bg-cyan-50 text-cyan-700 border-cyan-200/70"
                              }`}>
                                {cnTag}
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                              {item.note}
                            </p>
                          )}
                        </div>

                        {/* 右侧操作区：单项复制 + 预设开关 */}
                        <div className="flex items-center gap-2 shrink-0 self-center">
                          <button
                            onClick={() => handleCopySingle(item.title, item.note, idx)}
                            title="复制此项快捷键说明"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-all cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* 开关状态控制 */}
                          {isToggleable ? (
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isToggled}
                              onClick={() => handleToggleOption(item.title)}
                              title={
                                isToggled
                                  ? "已开启预设：点击关闭"
                                  : "未加入预设：点击开启后可通过“一键同步”自动模拟按键"
                              }
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isToggled
                                  ? "bg-emerald-500 shadow-xs shadow-emerald-500/40"
                                  : "bg-slate-200 hover:bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  isToggled ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          ) : (
                            <span
                              title="此项需多档位增减或手动数值输入，需在修改器窗口内设定喵~"
                              className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 select-none"
                            >
                              数值调节
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 官方使用说明卡片 (Description) */}
              {selectedTrainer.description && selectedTrainer.description.trim() && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>修改器特别说明与注意事项</span>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-50/70 p-3 rounded-xl border border-slate-100 font-mono text-[11px]">
                    {selectedTrainer.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
