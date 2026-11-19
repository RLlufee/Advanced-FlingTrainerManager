import React from "react";
import {
  Sliders,
  Zap,
  Search,
  X,
  Copy,
  Check,
  Sparkles,
  FileText,
} from "lucide-react";
import type { InstalledTrainerRecord, TrainerOptionItem } from "../../services/trainerApi";
import {
  translateHotkeyTitle,
  isToggleableOption,
} from "../../lib/hotkeyTranslate";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { HotkeyLabel } from "../ui/HotkeyLabel";
import { buttonClass } from "../ui/buttonStyles";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export interface HotkeyPanelProps {
  trainer: InstalledTrainerRecord;
  activeOptionItems: TrainerOptionItem[];
  filteredHotkeys: TrainerOptionItem[];
  hotkeyQuery: string;
  currentToggles: Record<string, boolean>;
  enabledTogglesCount: number;
  isSyncing: boolean;
  isEnriching: boolean;
  copiedKeyIdx: number | null;
  copiedAll: boolean;
  onHotkeyQueryChange: (q: string) => void;
  onSyncHotkeys: () => void;
  onToggleAll: (enableAll: boolean) => void;
  onCopyAll: () => void;
  onCopySingle: (title: string, note: string | null, idx: number) => void;
  onToggleOption: (title: string) => void;
  onEnrichTrainer: () => void;
}

export const HotkeyPanel: React.FC<HotkeyPanelProps> = ({
  trainer,
  activeOptionItems,
  filteredHotkeys,
  hotkeyQuery,
  currentToggles,
  enabledTogglesCount,
  isSyncing,
  isEnriching,
  copiedKeyIdx,
  copiedAll,
  onHotkeyQueryChange,
  onSyncHotkeys,
  onToggleAll,
  onCopyAll,
  onCopySingle,
  onToggleOption,
  onEnrichTrainer,
}) => {
  return (
    <div className="flex-1 p-6 space-y-5 overflow-y-auto">
      {/* 热键看板标题与状态预设工具栏 */}
      <div className="bg-white dark:bg-[#131c31] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <JellyIcon intensity="gentle">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
          </JellyIcon>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">功能与热键</h2>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                {filteredHotkeys.length} / {activeOptionItems.length} 项
              </span>
              {enabledTogglesCount > 0 && (
                <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-500/30">
                  已预设 {enabledTogglesCount} 项
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              打开开关加入预设，启动修改器后可一键按顺序触发
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* 一键同步预设按钮 */}
          <TypewriterTooltip text="在修改器启动后，自动模拟键盘依次开启所有已预设的开关项" position="top">
            <button
              onClick={onSyncHotkeys}
              disabled={enabledTogglesCount === 0 || isSyncing}
              className={buttonClass("soft", "sm", "shrink-0")}
            >
              <Zap className={`w-3.5 h-3.5 fill-current ${isSyncing ? "animate-pulse" : ""}`} />
              <span>
                {isSyncing
                  ? "正在同步…"
                  : enabledTogglesCount > 0
                  ? `一键同步预设 · ${enabledTogglesCount}`
                  : "一键同步预设"}
              </span>
            </button>
          </TypewriterTooltip>

          {/* 批量全开/清空开关小工具 */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-[11px] shrink-0">
            <button
              onClick={() => onToggleAll(true)}
              title="将当前修改器的所有二元开关项全部打开预设"
              className="px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer"
            >
              全开
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              onClick={() => onToggleAll(false)}
              title="清空当前所有开关预设"
              className="px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
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
              onChange={(e) => onHotkeyQueryChange(e.target.value)}
              placeholder="过滤热键功能..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {hotkeyQuery && (
              <button
                onClick={() => onHotkeyQueryChange("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 一键复制全部热键 */}
          <button
            onClick={onCopyAll}
            disabled={activeOptionItems.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">已复制全部</span>
              </>
            ) : (
              <>
                <JellyIcon intensity="gentle">
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </JellyIcon>
                <span>复制清单</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 热键双列卡片展示网格 */}
      {filteredHotkeys.length === 0 ? (
        <div className="bg-white dark:bg-[#131c31] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-10 text-center text-slate-400 dark:text-slate-500 space-y-4">
          <Sliders className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {hotkeyQuery ? "没有匹配的热键" : "还没有这款修改器的功能列表"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {hotkeyQuery
                ? "试试英文原词，例如 HP、Money、God"
                : "从风灵月影官网获取功能、热键说明和游戏封面。"}
            </p>
          </div>
          {!hotkeyQuery && (
            <button
              onClick={onEnrichTrainer}
              disabled={isEnriching}
              className={buttonClass("primary", "md")}
            >
              <Sparkles className={`w-4 h-4 ${isEnriching ? "animate-spin" : ""}`} />
              <span>{isEnriching ? "正在获取…" : "获取功能列表"}</span>
            </button>
          )}
        </div>
      ) : (
        <PaperContainer
          key={trainer.id + (hotkeyQuery ? "-filtered" : "")}
          staggerDelay={0.018}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {filteredHotkeys.map((item, idx) => {
            const cnTag = translateHotkeyTitle(item.title);
            const isCopied = copiedKeyIdx === idx;
            const isToggleable = isToggleableOption(item.title, item.note);
            const isToggled = Boolean(currentToggles[item.title]);

            return (
              <PaperCard
                key={idx}
                delayIndex={idx}
                tiltAngle={1.2}
                className={`rounded-xl border px-3 py-2.5 transition-colors flex items-center justify-between gap-3 group ${
                  isToggled
                    ? "bg-cyan-50/70 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/35"
                    : "bg-white dark:bg-[#131c31] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <HotkeyLabel
                  title={item.title}
                  tag={cnTag}
                  note={item.note}
                  active={isToggled}
                  className="flex-1"
                />

                {/* 右侧操作区：单项复制 + 预设开关 */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onCopySingle(item.title, item.note, idx)}
                    title="复制这一项"
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                      onClick={() => onToggleOption(item.title)}
                      title={isToggled ? "已加入预设，点击移除" : "加入预设，一键同步时自动触发"}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                        isToggled
                          ? "bg-cyan-600"
                          : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
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
                      title="多档位或数值类功能，请在修改器窗口内调节"
                      className="text-[11px] text-slate-400 dark:text-slate-500 px-1.5 select-none whitespace-nowrap"
                    >
                      数值项
                    </span>
                  )}
                </div>
              </PaperCard>
            );
          })}
        </PaperContainer>
      )}

      {/* 官方使用说明卡片 (Description) */}
      {trainer.description && trainer.description.trim() && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <JellyIcon intensity="gentle">
              <FileText className="w-4 h-4 text-slate-400" />
            </JellyIcon>
            <span>修改器特别说明与注意事项</span>
          </div>
          <div className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-50/70 p-3 rounded-xl border border-slate-100 font-mono text-[11px]">
            {trainer.description}
          </div>
        </div>
      )}
    </div>
  );
};