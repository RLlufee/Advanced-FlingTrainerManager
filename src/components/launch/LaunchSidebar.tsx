import React, { useEffect, useRef, useState } from "react";
import {
  Gamepad2,
  RefreshCw,
  Search,
  FolderTree,
  PlusCircle,
  X,
  ArrowUpCircle,
  FolderInput,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { InstalledTrainerRecord, TrainerUpdateInfo } from "../../services/trainerApi";
import { GamePoster } from "../GamePoster";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { buttonClass } from "../ui/buttonStyles";

interface LibraryMenuItem {
  key: string;
  label: string;
  busyLabel: string;
  icon: React.ReactNode;
  busy: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/** 已安装列表的"更多操作"菜单：把低频操作收进带文字标签的菜单，替代一排无标签小图标 */
const LibraryMenu: React.FC<{ items: LibraryMenuItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anyBusy = items.some((i) => i.busy);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
          open
            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
        {anyBusy && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="wallpaper-modal-target absolute right-0 top-full mt-1.5 z-30 w-52 p-1 rounded-xl bg-white dark:bg-[#131c31] border border-slate-200 dark:border-slate-700/80 shadow-lg shadow-slate-900/10 dark:shadow-black/40 origin-top-right"
          >
            {items.map((item) => (
              <button
                key={item.key}
                role="menuitem"
                disabled={item.disabled || item.busy}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-medium text-slate-700 dark:text-slate-200 enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <span className={`shrink-0 text-slate-400 dark:text-slate-500 ${item.busy ? "animate-spin" : ""}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.busy ? item.busyLabel : item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface LaunchSidebarProps {
  trainers: InstalledTrainerRecord[];
  filteredTrainers: InstalledTrainerRecord[];
  selectedId: string | null;
  searchQuery: string;
  updateMap: Record<string, TrainerUpdateInfo>;
  isImporting: boolean;
  isCheckingUpdate: boolean;
  isEnriching: boolean;
  isLoading: boolean;
  onSelectTrainer: (id: string) => void;
  onSearchQueryChange: (query: string) => void;
  onImportExternal: () => void;
  onCheckUpdates: () => void;
  onEnrichAll: () => void;
  onRefresh: () => void;
  onOpenTrainersRoot: () => void;
  onNavigateToDownload?: () => void;
}

export const LaunchSidebar: React.FC<LaunchSidebarProps> = ({
  trainers,
  filteredTrainers,
  selectedId,
  searchQuery,
  updateMap,
  isImporting,
  isCheckingUpdate,
  isEnriching,
  isLoading,
  onSelectTrainer,
  onSearchQueryChange,
  onImportExternal,
  onCheckUpdates,
  onEnrichAll,
  onRefresh,
  onOpenTrainersRoot,
  onNavigateToDownload,
}) => {
  return (
    <aside className="wallpaper-shell w-72 bg-white dark:bg-[#0f172a] border-r border-slate-200/90 dark:border-slate-800 flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)] transition-colors duration-200">
      {/* 顶部搜索过滤与工具栏 */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="搜索已安装修改器..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-750 transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pl-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            已安装 · {trainers.length}
          </span>
          <div className="flex items-center gap-0.5">
            <TypewriterTooltip text="刷新列表" position="top">
              <button
                onClick={onRefresh}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-600 dark:text-cyan-400" : ""}`} />
              </button>
            </TypewriterTooltip>
            <LibraryMenu
              items={[
                {
                  key: "import",
                  label: "导入本地修改器…",
                  busyLabel: "正在扫描…",
                  icon: <FolderInput className="w-4 h-4" />,
                  busy: isImporting,
                  onSelect: onImportExternal,
                },
                {
                  key: "update",
                  label: "检查更新",
                  busyLabel: "正在检查更新…",
                  icon: <ArrowUpCircle className="w-4 h-4" />,
                  busy: isCheckingUpdate,
                  disabled: trainers.length === 0,
                  onSelect: onCheckUpdates,
                },
                {
                  key: "enrich",
                  label: "补全封面与功能列表",
                  busyLabel: "正在补全…",
                  icon: <Sparkles className="w-4 h-4" />,
                  busy: isEnriching,
                  disabled: trainers.length === 0,
                  onSelect: onEnrichAll,
                },
                {
                  key: "folder",
                  label: "打开修改器目录",
                  busyLabel: "打开修改器目录",
                  icon: <FolderTree className="w-4 h-4" />,
                  busy: false,
                  onSelect: onOpenTrainersRoot,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* 已安装修改器列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 relative">
        {filteredTrainers.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <JellyIcon intensity="gentle">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            </JellyIcon>
            <p className="text-xs font-medium">
              {searchQuery ? "没有匹配的修改器" : "还没有安装修改器"}
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {searchQuery ? "换个关键词试试" : "可以从下载页获取，或导入本地已有的修改器"}
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
                onClick={() => onSelectTrainer(t.id)}
                className={`relative w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left group cursor-pointer ${
                  isSelected
                    ? "text-slate-900 dark:text-slate-100 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                }`}
              >
                {/* 活跃项流体药丸滑动背景 */}
                {isSelected && (
                  <motion.div
                    layoutId="launch-sidebar-pill"
                    className="absolute inset-0 bg-primary-soft rounded-xl shadow-xs border border-primary-border z-0"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                  />
                )}

                {/* 微缩海报 */}
                <div className="relative z-10 w-9 h-11 rounded-md overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs">
                  <GamePoster
                    key={`${t.id}-${t.capsule_image || ""}-${t.thumbnail || ""}-${optionCount}`}
                    primarySrc={t.capsule_image}
                    secondarySrc={t.thumbnail}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    showInitials={false}
                  />
                </div>

                {/* 游戏名与版本徽章 */}
                <div className="relative z-10 truncate flex-1 min-w-0">
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

      {/* 边栏底部：去下载 */}
      {onNavigateToDownload && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onNavigateToDownload} className={buttonClass("secondary", "sm", "w-full")}>
            <PlusCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>下载更多修改器</span>
          </button>
        </div>
      )}
    </aside>
  );
};
