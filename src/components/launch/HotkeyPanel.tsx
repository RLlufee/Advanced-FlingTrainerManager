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
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
          </JellyIcon>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">修改器功能热键看板</h2>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700">
                {filteredHotkeys.length} / {activeOptionItems.length} 项
              </span>
              {enabledTogglesCount > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800">
                  已预设 {enabledTogglesCount} 项
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              支持记录开关状态并一键模拟按键同步 · 支持中英文同义词搜索
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* 一键同步预设按钮 */}
          <TypewriterTooltip text="在修改器启动后，自动模拟键盘依次开启所有已预设的开关项" position="top">
            <button
              onClick={onSyncHotkeys}
              disabled={enabledTogglesCount === 0 || isSyncing}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <JellyIcon intensity="bouncy">
                <Zap className={`w-3.5 h-3.5 fill-white ${isSyncing ? "animate-bounce" : ""}`} />
              </JellyIcon>
              <span>
                {isSyncing ? "正在模拟按键同步..." : `一键同步预设 (${enabledTogglesCount})`}
              </span>
            </button>
          </TypewriterTooltip>

          {/* 批量全开/清空开关小工具 */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-[11px] shrink-0">
            <button
              onClick={() => onToggleAll(true)}
              title="将当前修改器的所有二元开关项全部打开预设"
              className="px-2 py-1 rounded text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
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
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-750 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
              {hotkeyQuery ? "未找到符合过滤条件的热键" : "该修改器尚未同步官方功能看板与热键说明"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              {hotkeyQuery
                ? "可以尝试搜索拼音或英文原词（如 HP, Money, God）"
                : "检测到此修改器缺少结构化热键数据，点击下方按钮即可秒级联网匹配风灵月影官方功能项、按键清单及高清封面海报！"}
            </p>
          </div>
          {!hotkeyQuery && (
            <button
              onClick={onEnrichTrainer}
              disabled={isEnriching}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary-glow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <JellyIcon intensity="bouncy">
                <Sparkles className={`w-4 h-4 text-white ${isEnriching ? "animate-spin" : ""}`} />
              </JellyIcon>
              <span>
                {isEnriching ? "正在匹配风灵月影官方数据..." : "一键获取官方功能看板与封面"}
              </span>
            </button>
          )}
        </div>
      ) : (
        <PaperContainer
          key={trainer.id + (hotkeyQuery ? "-filtered" : "")}
          staggerDelay={0.018}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
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
                className={`rounded-xl border p-3 shadow-2xs transition-all flex items-start justify-between gap-3 group ${
                  isToggled
                    ? "bg-emerald-50/20 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-700/80 ring-1 ring-emerald-500/15 shadow-xs"
                    : "bg-white dark:bg-[#131c31] border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-primary/80"
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold leading-snug ${
                        isToggled ? "text-emerald-900 dark:text-emerald-300 font-bold" : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {item.title}
                    </span>
                    {cnTag && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${
                          isToggled
                            ? "bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-700/70"
                            : "bg-primary-soft text-primary-text border-primary-border"
                        }`}
                      >
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
                    onClick={() => onCopySingle(item.title, item.note, idx)}
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
                      onClick={() => onToggleOption(item.title)}
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