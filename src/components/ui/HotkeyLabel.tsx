import React from "react";
import { splitHotkeyTitle } from "../../lib/hotkeyTranslate";

/** 单个键帽 */
export const KeyCap: React.FC<{ children: React.ReactNode; active?: boolean }> = ({ children, active }) => (
  <kbd
    className={`inline-flex h-[22px] min-w-[22px] items-center justify-center px-1.5 rounded-md border border-b-2 font-mono text-[11px] font-semibold leading-none whitespace-nowrap transition-colors ${
      active
        ? "bg-white text-cyan-700 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-500/40"
        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
    }`}
  >
    {children}
  </kbd>
);

export interface HotkeyLabelProps {
  title: string;
  /** 中文译名标签（英文原名时显示） */
  tag?: string | null;
  note?: string | null;
  active?: boolean;
  className?: string;
}

/**
 * 热键条目：左侧功能名（含可选中文标签与说明），右侧键帽。
 * 功能名统一左对齐便于扫读；键帽靠右贴近开关，组合键长短不一也不会撑出空洞。
 * 启动页热键看板与下载页功能清单共用，保证两处视觉一致。
 */
export const HotkeyLabel: React.FC<HotkeyLabelProps> = ({ title, tag, note, active, className = "" }) => {
  const { keys, label } = splitHotkeyTitle(title);

  return (
    <div className={`flex items-start gap-3 min-w-0 ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0 h-[22px]">
          <span
            className={`truncate text-[13px] font-medium ${
              active ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"
            }`}
            title={label}
          >
            {label}
          </span>
          {tag && (
            <span className="shrink-0 px-1.5 py-px rounded text-[11px] font-medium text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800">
              {tag}
            </span>
          )}
        </div>
        {note && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{note}</p>
        )}
      </div>
      {keys.length > 0 && (
        <span className="flex items-center gap-1 shrink-0">
          {keys.map((k, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[10px] text-slate-400 dark:text-slate-500">+</span>}
              <KeyCap active={active}>{k}</KeyCap>
            </React.Fragment>
          ))}
        </span>
      )}
    </div>
  );
};
