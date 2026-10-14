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
  X
} from "lucide-react";
import {
  trainerApi,
  InstalledTrainerRecord,
  TrainerOptionItem,
} from "../services/trainerApi";
import { GamePoster } from "./GamePoster";
import {
  matchHotkey,
  translateHotkeyTitle,
  formatAllHotkeys,
} from "../lib/hotkeyTranslate";
import { convertFileSrc } from "@tauri-apps/api/core";

// 本地文件绝对路径转换为 Tauri 安全 asset 协议
const resolveAssetUrl = (url?: string | null): string => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("asset://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  try {
    return convertFileSrc(url);
  } catch {
    return url;
  }
};

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
    if (selectedTrainer.option_items && selectedTrainer.option_items.length > 0) {
      return selectedTrainer.option_items;
    }
    if (selectedTrainer.options && selectedTrainer.options.length > 0) {
      return selectedTrainer.options.map((title) => ({
        title,
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
                onClick={() => loadTrainers(selectedId || undefined)}
                title="刷新已安装列表"
                className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600" : ""}`} />
              </button>
              <button
                onClick={handleOpenTrainersRoot}
                title="打开 trainers 便携存储根目录"
                className="p-1 rounded text-slate-400 hover:text-cyan-600 hover:bg-slate-100 transition-colors"
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
                    <div className="truncate text-slate-800 font-semibold text-xs leading-snug">
                      {displayName}
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

        {/* 边栏底部：去下载更多 */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
          {onNavigateToDownload && (
            <button
              onClick={onNavigateToDownload}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200/60 shadow-2xs transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-600" />
              <span>浏览并下载更多修改器...</span>
            </button>
          )}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
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
              笨蛋主人，这里还没有选中的修改器喵！请在左侧点击已安装的游戏，或者去下载库下载心仪的修改器吧~
            </p>
            {onNavigateToDownload && (
              <button
                onClick={onNavigateToDownload}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>前往下载库下载修改器</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* 顶部宽幅英雄区 (Hero Banner) */}
            <div className="relative overflow-hidden bg-slate-900 text-white border-b border-slate-700/60 shadow-md shrink-0">
              {/* 背景原画大图 + 毛玻璃与渐变遮罩 */}
              {selectedTrainer.hero_image && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30 blur-xs scale-105 transition-transform duration-700"
                  style={{ backgroundImage: `url(${resolveAssetUrl(selectedTrainer.hero_image)})` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/75" />

              {/* 核心内容区 */}
              <div className="relative p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* 封面图与标题 */}
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-600/60 shadow-xl bg-slate-800">
                    <GamePoster
                      primarySrc={selectedTrainer.capsule_image}
                      secondarySrc={selectedTrainer.thumbnail}
                      alt={selectedTrainer.chinese_name || selectedTrainer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                      <h1 className="text-xl font-extrabold text-white tracking-tight truncate">
                        {selectedTrainer.chinese_name || selectedTrainer.name}
                      </h1>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        已就绪
                      </span>
                    </div>

                    {selectedTrainer.chinese_name && (
                      <p className="text-xs text-slate-300/90 truncate mb-2">
                        {selectedTrainer.name}
                      </p>
                    )}

                    {/* 属性与版本徽章 */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                        修改器 {selectedTrainer.version}
                      </span>

                      {selectedTrainer.game_version && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/80">
                          支持游戏: {selectedTrainer.game_version}
                        </span>
                      )}

                      {selectedTrainer.steam_app_id && (
                        <button
                          onClick={() => trainerApi.openSteamStore(selectedTrainer.steam_app_id!)}
                          title="在浏览器中查看 Steam 商店页"
                          className="px-2 py-0.5 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 flex items-center gap-1 transition-colors"
                        >
                          <Gamepad2 className="w-3 h-3 text-sky-400" />
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
                  {/* 一键启动修改器大按钮 */}
                  <button
                    onClick={handleLaunchTrainer}
                    disabled={isLaunching}
                    className="flex-1 lg:flex-initial px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-900/40 hover:shadow-amber-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>运行游戏</span>
                    </button>
                  )}

                  {/* 打开所在目录 */}
                  <button
                    onClick={handleOpenInstallDir}
                    title="在系统资源管理器中打开当前修改器子目录"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl transition-all"
                  >
                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                  </button>

                  {/* 卸载/删除修改器 */}
                  <button
                    onClick={() => setDeleteConfirmId(selectedTrainer.id)}
                    title="删除此修改器及本地文件"
                    className="p-2.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800/80 active:scale-95 text-slate-400 border border-slate-700 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 下方核心内容区：功能热键看板 */}
            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              {/* 热键看板标题与搜索过滤栏 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-800">
                        修改器功能热键看板
                      </h2>
                      <span className="text-[11px] font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60">
                        {filteredHotkeys.length} / {activeOptionItems.length} 项
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      支持中英文同义词搜索（如输入“生命”、“金钱”、“无敌”、“一击必杀”）
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  {/* 热键搜索框 */}
                  <div className="relative flex-1 md:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={hotkeyQuery}
                      onChange={(e) => setHotkeyQuery(e.target.value)}
                      placeholder="过滤热键功能..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all text-slate-700"
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
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">已复制全部</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>复制全部清单</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 热键双列卡片展示网格 */}
              {filteredHotkeys.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400">
                  <Sliders className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-700">
                    {hotkeyQuery ? "未找到符合过滤条件的热键" : "该修改器暂无结构化热键信息"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {hotkeyQuery ? "可以尝试搜索拼音或英文原词（如 HP, Money, God）" : "可以直接启动修改器在界面内查看"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredHotkeys.map((item, idx) => {
                    const cnTag = translateHotkeyTitle(item.title);
                    const isCopied = copiedKeyIdx === idx;

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs hover:shadow-md hover:border-cyan-300/80 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-800 leading-snug">
                              {item.title}
                            </span>
                            {cnTag && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/70 shrink-0">
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

                        {/* 单项复制按钮 */}
                        <button
                          onClick={() => handleCopySingle(item.title, item.note, idx)}
                          title="复制此项快捷键说明"
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-all shrink-0"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
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
