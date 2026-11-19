import React from "react";
import { Gamepad2, FolderInput, PlusCircle } from "lucide-react";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { buttonClass } from "../ui/buttonStyles";

export interface LaunchEmptyStateProps {
  isImporting: boolean;
  onImportExternal: () => void;
  onNavigateToDownload?: () => void;
}

export const LaunchEmptyState: React.FC<LaunchEmptyStateProps> = ({
  isImporting,
  onImportExternal,
  onNavigateToDownload,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
      <PaperContainer className="flex flex-col items-center justify-center max-w-md">
        <PaperCard className="p-8 rounded-3xl bg-white dark:bg-[#131c31] border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-center">
          <div className="mb-4">
            <JellyIcon intensity="bouncy">
              <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-primary-border shadow-xs flex items-center justify-center text-primary">
                <Gamepad2 className="w-8 h-8" />
              </div>
            </JellyIcon>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">选择一个修改器开始</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 mb-6 leading-relaxed">
            从左侧列表中选择，或导入电脑里已有的修改器，也可以去下载页获取新的。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TypewriterTooltip text="选择一个文件夹，扫描其中的修改器" position="top">
              <button
                onClick={onImportExternal}
                disabled={isImporting}
                className={buttonClass("secondary", "md")}
              >
                <JellyIcon intensity="gentle">
                  <FolderInput className={`w-4 h-4 text-primary ${isImporting ? "animate-bounce" : ""}`} />
                </JellyIcon>
                <span>{isImporting ? "正在扫描…" : "导入本地修改器"}</span>
              </button>
            </TypewriterTooltip>

            {onNavigateToDownload && (
              <TypewriterTooltip text="浏览风灵月影官网的修改器" position="top">
                <button
                  onClick={onNavigateToDownload}
                  className={buttonClass("primary", "md")}
                >
                  <JellyIcon intensity="gentle">
                    <PlusCircle className="w-4 h-4 text-white" />
                  </JellyIcon>
                  <span>去下载页</span>
                </button>
              </TypewriterTooltip>
            )}
          </div>
        </PaperCard>
      </PaperContainer>
    </div>
  );
};