import React from "react";
import { Upload } from "lucide-react";

interface WallpaperDropZoneProps {
  dropzoneRef: React.RefObject<HTMLDivElement | null>;
  isDraggingOver: boolean;
  isImporting: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const WallpaperDropZone: React.FC<WallpaperDropZoneProps> = ({
  dropzoneRef,
  isDraggingOver,
  isImporting,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  return (
    <div
      ref={dropzoneRef}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-center transition-colors ${
        isDraggingOver
          ? "border-primary bg-primary-soft/40"
          : "border-slate-300 bg-slate-50/70 hover:border-primary dark:border-slate-700 dark:bg-slate-900/40"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary-border bg-primary-soft text-primary">
        <Upload className={`h-4 w-4 ${isImporting ? "animate-pulse" : ""}`} />
      </span>
      <span className="text-left">
        <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
          {isImporting
            ? "正在复制并保存壁纸…"
            : isDraggingOver
              ? "松开鼠标以添加壁纸"
              : "拖入图片，或点击此处选择文件"}
        </span>
        <span className="mt-0.5 block text-[10px] text-slate-400">
          支持 PNG / JPG / WebP / BMP，单张最大 20 MB；自动复制进应用数据目录保存
        </span>
      </span>
    </div>
  );
};
