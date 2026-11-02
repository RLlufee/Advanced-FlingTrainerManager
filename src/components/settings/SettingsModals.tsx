import React from "react";
import {
  Download,
  Upload,
  Check,
  Copy,
  AlertTriangle,
  HardDrive,
  MoveRight,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { StorageStats } from "../../services/configApi";
import { JellyIcon } from "../ui/motion/JellyIcon";

interface ExportPresetModalProps {
  exportJson: string | null;
  onClose: () => void;
  onCopy: () => void;
  isCopied: boolean;
}

export const ExportPresetModal: React.FC<ExportPresetModalProps> = ({
  exportJson,
  onClose,
  onCopy,
  isCopied,
}) => {
  if (!exportJson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <JellyIcon intensity="gentle">
              <Download className="w-4 h-4 text-cyan-600" />
            </JellyIcon>
            所有修改器开关预设备份数据
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            关闭
          </button>
        </div>
        <textarea
          readOnly
          value={exportJson}
          rows={10}
          className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
        />
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCopy}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <JellyIcon intensity="bouncy">
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </JellyIcon>
            <span>{isCopied ? "已复制到剪贴板！" : "复制备份 JSON"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImportPresetModalProps {
  show: boolean;
  onClose: () => void;
  input: string;
  setInput: (value: string) => void;
  onImport: () => void;
}

export const ImportPresetModal: React.FC<ImportPresetModalProps> = ({
  show,
  onClose,
  input,
  setInput,
  onImport,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <JellyIcon intensity="gentle">
              <Upload className="w-4 h-4 text-cyan-600" />
            </JellyIcon>
            导入还原开关预设
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            取消
          </button>
        </div>
        <p className="text-xs text-slate-500">
          请在此处粘贴此前导出的预设 JSON 文本，系统将根据游戏名与 ID 自动匹配并覆盖更新已安装游戏的开关配置：
        </p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="在此粘贴包含 saved_toggles 的 JSON 数组..."
          rows={9}
          className="w-full font-mono text-[11px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
        />
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={onImport}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <JellyIcon intensity="bouncy">
              <Check className="w-3.5 h-3.5" />
            </JellyIcon>
            <span>立即导入并还原</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ClearPresetsConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearPresetsConfirmModal: React.FC<ClearPresetsConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4">
        <JellyIcon intensity="bouncy">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </JellyIcon>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-slate-900">确定要清空全部预设吗？</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            此操作将把所有已安装修改器的开关预设重置为空，修改器文件本体不会受到任何影响。
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            确认彻底清空
          </button>
        </div>
      </div>
    </div>
  );
};

interface MigrationModalProps {
  show: boolean;
  targetDir: string | null;
  storageStats: StorageStats | null;
  isMigrating: boolean;
  onClose: () => void;
  onSwitchPathOnly: () => void;
  onStartMigration: () => void;
  formatBytes: (bytes: number) => string;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  show,
  targetDir,
  storageStats,
  isMigrating,
  onClose,
  onSwitchPathOnly,
  onStartMigration,
  formatBytes,
}) => {
  if (!show || !targetDir) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <JellyIcon intensity="bouncy">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                <HardDrive className="w-5 h-5" />
              </div>
            </JellyIcon>
            <div>
              <h3 className="text-sm font-bold text-slate-900">修改器存储路径迁移向导</h3>
              <p className="text-xs text-slate-400">
                检测到您指定了新的根目录，请选择接下来的处理方案喵~
              </p>
            </div>
          </div>
          {!isMigrating && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              取消
            </button>
          )}
        </div>

        {/* 路径迁移流向卡片 */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>路径变更流向</span>
            <span className="text-cyan-700 font-semibold">
              共 {storageStats?.trainers_count ?? 0} 款已安装修改器 · 约{" "}
              {formatBytes(storageStats?.total_size_bytes || 0)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                当前原路径
              </div>
              <div
                className="font-mono text-xs text-slate-700 truncate"
                title={storageStats?.trainers_dir || ""}
              >
                {storageStats?.trainers_dir || "默认应用数据目录"}
              </div>
            </div>

            <div className="flex justify-center -my-1 text-cyan-600">
              <div className="w-6 h-6 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center shadow-xs">
                <MoveRight className="w-3.5 h-3.5 rotate-90 sm:rotate-0" />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-50/60 border border-cyan-200">
              <div className="text-[10px] text-cyan-600 font-semibold uppercase tracking-wider mb-0.5">
                迁往新目标路径
              </div>
              <div
                className="font-mono text-xs text-cyan-950 font-medium truncate"
                title={targetDir}
              >
                {targetDir}
              </div>
            </div>
          </div>
        </div>

        {/* 迁移提示说明 */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800 space-y-1 leading-relaxed">
          <div className="font-semibold flex items-center gap-1.5 text-amber-900">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>无损搬家安全保障说明：</span>
          </div>
          <p className="text-[11px] text-amber-700 pl-5">
            • <strong>一键无损搬家</strong>：自动把现有修改器文件夹完整剪切至新盘符，并更新所有内置路径索引与封面，已有数据绝不丢失！
            <br />• <strong>仅切换路径</strong>：仅保存新目录作为未来下载/导入位置，原修改器仍保留在老目录。
          </p>
        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          {!isMigrating && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-all"
            >
              取消
            </button>
          )}

          <button
            onClick={onSwitchPathOnly}
            disabled={isMigrating}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            仅切换路径
          </button>

          <button
            onClick={onStartMigration}
            disabled={isMigrating}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>正在搬家迁移中...</span>
              </>
            ) : (
              <>
                <JellyIcon intensity="bouncy">
                  <Sparkles className="w-3.5 h-3.5" />
                </JellyIcon>
                <span>开始一键无损搬家</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};