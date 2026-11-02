import React from "react";
import { Gamepad2, FolderInput, PlusCircle } from "lucide-react";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

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
        <PaperCard className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col items-center">
          <div className="mb-4">
            <JellyIcon intensity="bouncy">
              <div className="w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 shadow-xs flex items-center justify-center text-cyan-600">
                <Gamepad2 className="w-8 h-8" />
              </div>
            </JellyIcon>
          </div>
          <h2 className="text-lg font-bold text-slate-800">未选择任何修改器</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1.5 mb-6 leading-relaxed">
            笨蛋主人，这里还没有选中的修改器喵！可以点击下方扫描电脑里已下载的修改器，或者去下载库挑选新游戏吧~
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <TypewriterTooltip text="调出系统目录选择器，扫描并纳管历史已有修改器" position="top">
              <button
                onClick={onImportExternal}
                disabled={isImporting}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <JellyIcon intensity="gentle">
                  <FolderInput className={`w-4 h-4 text-cyan-600 ${isImporting ? "animate-bounce" : ""}`} />
                </JellyIcon>
                <span>{isImporting ? "正在扫描纳管..." : "批量导入已有修改器"}</span>
              </button>
            </TypewriterTooltip>

            {onNavigateToDownload && (
              <TypewriterTooltip text="浏览风灵月影千款热门游戏修改器并在本地一键下载" position="top">
                <button
                  onClick={onNavigateToDownload}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <JellyIcon intensity="gentle">
                    <PlusCircle className="w-4 h-4 text-cyan-400" />
                  </JellyIcon>
                  <span>前往下载库下载修改器</span>
                </button>
              </TypewriterTooltip>
            )}
          </div>
        </PaperCard>
      </PaperContainer>
    </div>
  );
};