import React from "react";
import { AlertCircle } from "lucide-react";

export interface DeleteConfirmModalProps {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  onCancel,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-rose-400 mb-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-sm text-slate-100">确认删除该修改器？</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          这将彻底删除该修改器在{" "}
          <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">
            trainers/
          </code>{" "}
          目录下的子文件夹、可执行程序及元数据，该操作不可撤销。
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 transition-all cursor-pointer"
          >
            彻底删除
          </button>
        </div>
      </div>
    </div>
  );
};
