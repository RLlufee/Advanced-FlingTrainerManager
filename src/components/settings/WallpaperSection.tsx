import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Image as ImageIcon,
  ImagePlus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { WallpaperSavedImage, configApi } from "../../services/configApi";
import { useTheme } from "../ui/theme";
import { FluidSlider } from "../ui/motion/FluidSlider";
import { PaperCard } from "../ui/motion/PaperFlutter";

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|bmp)$/i;

const isInsideDropZone = (
  element: HTMLElement | null,
  position: { x: number; y: number }
): boolean => {
  if (!element || element.offsetParent === null) return false;
  const rect = element.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const x = position.x / scale;
  const y = position.y / scale;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
};

const WallpaperThumbnail: React.FC<{ image: WallpaperSavedImage }> = ({ image }) => {
  const [source, setSource] = useState("");
  const [fallbackTried, setFallbackTried] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFallbackTried(false);
    setFailed(false);
    try {
      setSource(convertFileSrc(image.image_path));
    } catch {
      setSource(image.image_path);
    }
  }, [image.image_path]);

  const handleError = async () => {
    if (!fallbackTried) {
      setFallbackTried(true);
      try {
        setSource(await configApi.readImageAsDataUrl(image.image_path));
        return;
      } catch {
        // 图片不可读取时展示损坏占位，仍允许用户移除该项。
      }
    }
    setFailed(true);
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
      {failed || !source ? (
        <div className="flex h-full items-center justify-center text-slate-400">
          <ImageIcon className="h-6 w-6" />
        </div>
      ) : (
        <img
          src={source}
          alt={image.name}
          onError={handleError}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
};

export const WallpaperSection: React.FC = () => {
  const {
    wallpaperImages,
    activeWallpaper,
    wallpaperOpacity,
    wallpaperBlur,
    wallpaperFit,
    wallpaperSurfaceTransparency,
    isWallpaperLoadFailed,
    addWallpaperFromFiles,
    addWallpaperFromPaths,
    selectWallpaper,
    removeWallpaper,
    clearActiveWallpaper,
    setWallpaperOpacity,
    setWallpaperBlur,
    setWallpaperFit,
    setWallpaperSurfaceTransparency,
  } = useTheme();

  const [isImporting, setIsImporting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const reportImport = async (importer: () => Promise<number>) => {
    setIsImporting(true);
    setMessage("");
    try {
      const count = await importer();
      setMessage(
        count > 0
          ? `已导入 ${count} 张壁纸，首张已应用。`
          : "没有可导入的图片。请使用 PNG、JPG、WebP 或 BMP，且单张不超过 20 MB。"
      );
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;

    const setup = async () => {
      try {
        const stopListening = await getCurrentWebview().onDragDropEvent(async (event) => {
          const payload = event.payload;
          if (payload.type === "leave") {
            setIsDraggingOver(false);
            return;
          }
          const isTargeted = isInsideDropZone(dropzoneRef.current, payload.position);
          setIsDraggingOver(isTargeted && payload.type !== "drop");
          if (payload.type === "drop") {
            setIsDraggingOver(false);
            if (isTargeted && payload.paths.some((path) => IMAGE_EXTENSION.test(path))) {
              await reportImport(() => addWallpaperFromPaths(payload.paths));
            }
          }
        });
        if (disposed) stopListening();
        else unlisten = stopListening;
      } catch {
        // 浏览器预览中没有 Tauri 文件拖放事件，DOM 拖放仍可使用。
      }
    };

    void setup();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [addWallpaperFromPaths]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length > 0) await reportImport(() => addWallpaperFromFiles(files));
    event.target.value = "";
  };

  const handleDomDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(event.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/") || IMAGE_EXTENSION.test(file.name)
    );
    if (files.length > 0) await reportImport(() => addWallpaperFromFiles(files));
  };

  const handleRemove = async (id: string) => {
    try {
      await removeWallpaper(id);
      setMessage("壁纸及其应用内副本已删除。");
    } catch (error) {
      setMessage(`删除壁纸失败：${error}`);
    }
  };

  return (
    <PaperCard className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-[#131c31] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <ImageIcon className="h-4 w-4 text-primary" />
            自定义壁纸
          </h3>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            壁纸铺设于标题栏下方的整个界面，并复制到管理器数据目录，原图移动后仍可使用。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeWallpaper && (
            <button
              type="button"
              onClick={() => clearActiveWallpaper()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              暂时关闭
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            添加壁纸
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        ref={dropzoneRef}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDomDrop}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-center transition-colors ${
          isDraggingOver
            ? "border-primary bg-primary-soft"
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
            支持 PNG / JPG / WebP / BMP，单张最大 20 MB；可添加多张并随时切换
          </span>
        </span>
      </div>

      {message && <p className="text-[11px] text-slate-500 dark:text-slate-400">{message}</p>}

      {isWallpaperLoadFailed && activeWallpaper && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            当前壁纸无法读取，已恢复主题渐变。可移除损坏项目后重新导入。
          </span>
          <button
            type="button"
            onClick={() => void handleRemove(activeWallpaper.id)}
            className="shrink-0 rounded-md px-2 py-1 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            移除损坏项
          </button>
        </div>
      )}

      {wallpaperImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {wallpaperImages.map((image) => {
            const selected = image.id === activeWallpaper?.id && !isWallpaperLoadFailed;
            return (
              <div
                key={image.id}
                className={`group relative rounded-xl border p-2 transition-colors ${
                  selected
                    ? "border-primary ring-1 ring-primary/40"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => void selectWallpaper(image.id)}
                  className="block w-full cursor-pointer text-left"
                  aria-label={`应用壁纸 ${image.name}`}
                >
                  <WallpaperThumbnail image={image} />
                  <span className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    <span className="truncate" title={image.name}>{image.name}</span>
                    {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </span>
                </button>
                <button
                  type="button"
                  title={`删除壁纸 ${image.name}`}
                  aria-label={`删除壁纸 ${image.name}`}
                  onClick={() => void handleRemove(image.id)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-slate-950/65 p-1.5 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-xs text-slate-400 dark:border-slate-700">
          尚未添加壁纸
        </div>
      )}

      {activeWallpaper && !isWallpaperLoadFailed && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 dark:border-slate-700/70 dark:bg-slate-900/40 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200">壁纸显现度</span>
                <span className="font-mono text-slate-500">{wallpaperOpacity}%</span>
              </div>
              <FluidSlider
                value={wallpaperOpacity}
                min={0}
                max={100}
                onChange={(value) => void setWallpaperOpacity(value)}
                formatValue={(value) => `${value}%`}
                ariaLabel="壁纸显现度"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200">壁纸模糊</span>
                <span className="font-mono text-slate-500">{wallpaperBlur} px</span>
              </div>
              <FluidSlider
                value={wallpaperBlur}
                min={0}
                max={20}
                onChange={(value) => void setWallpaperBlur(value)}
                formatValue={(value) => `${value} px`}
                ariaLabel="壁纸模糊强度"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200">界面透光度</span>
                <span className="font-mono text-slate-500">{wallpaperSurfaceTransparency}%</span>
              </div>
              <FluidSlider
                value={wallpaperSurfaceTransparency}
                min={0}
                max={50}
                onChange={(value) => void setWallpaperSurfaceTransparency(value)}
                formatValue={(value) => `${value}%`}
                ariaLabel="侧栏和页面背景透光度"
              />
            </div>
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                图片显示方式
              </span>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["cover", "填充裁切"],
                  ["contain", "完整适应"],
                ] as const).map(([fit, label]) => (
                  <button
                    key={fit}
                    type="button"
                    aria-pressed={wallpaperFit === fit}
                    onClick={() => void setWallpaperFit(fit)}
                    className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors ${
                      wallpaperFit === fit
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PaperCard>
  );
};
