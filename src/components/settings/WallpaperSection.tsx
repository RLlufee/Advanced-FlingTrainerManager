/**
 * @file WallpaperSection.tsx
 * @description 设置中心 - 自定义壁纸中枢
 * 支持开关控制、动画弹出主配置抽屉、图库选择、参数调节与二级游乐场（Playground）调试抽屉。
 */

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  ImagePlus,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useTheme } from "../ui/theme";
import { useAnimationConfig } from "../ui/motion/AnimationContext";
import { PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { WallpaperPlaygroundDrawer } from "./WallpaperPlaygroundDrawer";
import {
  WallpaperDropZone,
  WallpaperGallery,
  WallpaperControls,
} from "./wallpaper";

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

export const WallpaperSection: React.FC = () => {
  const {
    wallpaperEnabled,
    wallpaperImages,
    activeWallpaper,
    wallpaperOpacity,
    wallpaperBlur,
    wallpaperFit,
    isWallpaperLoadFailed,
    currentAccent,
    setWallpaperEnabled,
    addWallpaperFromFiles,
    addWallpaperFromPaths,
    selectWallpaper,
    removeWallpaper,
    clearActiveWallpaper,
    setWallpaperOpacity,
    setWallpaperBlur,
    setWallpaperFit,
  } = useTheme();

  const { effectiveSpeed } = useAnimationConfig();

  // 主抽屉折叠展开状态：当壁纸开关开启时默认展开
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  // 二级抽屉：图层覆盖调试游乐场
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState<boolean>(false);

  const [isImporting, setIsImporting] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // 监听 wallpaperEnabled 变更，当打开时自动展开抽屉，关闭时收起游乐场
  useEffect(() => {
    if (wallpaperEnabled) {
      setIsDrawerOpen(true);
    } else {
      setIsPlaygroundOpen(false);
    }
  }, [wallpaperEnabled]);

  const handleToggleSwitch = async () => {
    const next = !wallpaperEnabled;
    await setWallpaperEnabled(next);
    if (next) {
      setIsDrawerOpen(true);
    }
  };

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
    if (!wallpaperEnabled || !isDrawerOpen) return;

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
  }, [wallpaperEnabled, isDrawerOpen, addWallpaperFromPaths]);

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
      {/* 卡片头部：功能标题与核心开关 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <JellyIcon intensity="gentle">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-300"
              style={{
                backgroundColor: wallpaperEnabled ? currentAccent.primary : undefined,
                color: wallpaperEnabled ? "#ffffff" : undefined,
              }}
            >
              <ImageIcon
                className={`w-4 h-4 ${
                  wallpaperEnabled ? "text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              />
            </div>
          </JellyIcon>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                自定义壁纸
              </h3>
              {wallpaperEnabled ? (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: currentAccent.soft,
                    color: currentAccent.text,
                    border: `1px solid ${currentAccent.border}`,
                  }}
                >
                  {activeWallpaper ? `已应用: ${activeWallpaper.name}` : "已开启 (请选壁纸)"}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  已关闭 (保留记忆)
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              开启后壁纸铺设于界面底层，展开配置抽屉可添加图库并启动「图层覆盖游乐场」喵~
            </p>
          </div>
        </div>

        {/* 右侧：折叠抽屉切换与主开关 */}
        <div className="flex items-center gap-3">
          {wallpaperEnabled && (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              {isDrawerOpen ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>收起配置抽屉</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>展开配置抽屉</span>
                </>
              )}
            </button>
          )}

          {/* 标准规范 Switch 开关 */}
          <button
            type="button"
            role="switch"
            aria-checked={wallpaperEnabled}
            aria-label="自定义壁纸总开关"
            onClick={() => void handleToggleSwitch()}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              wallpaperEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                wallpaperEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 隐藏的真实文件选择框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 动画弹出的主配置抽屉 (Drawer) */}
      <AnimatePresence initial={false}>
        {wallpaperEnabled && isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              type: "spring",
              stiffness: Math.round(300 * effectiveSpeed),
              damping: 28,
            }}
            className="overflow-hidden space-y-4 pt-1"
          >
            {/* 抽屉工具条 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>壁纸库管理与调节</span>
                <span className="text-[10px] font-normal text-slate-400">
                  （已保存 {wallpaperImages.length} 张图片）
                </span>
              </span>

              <div className="flex items-center gap-2">
                {activeWallpaper && (
                  <button
                    type="button"
                    onClick={() => clearActiveWallpaper()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>暂时停用</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  <span>添加壁纸</span>
                </button>
              </div>
            </div>

            {/* 拖放投放区域 */}
            <WallpaperDropZone
              dropzoneRef={dropzoneRef}
              isDraggingOver={isDraggingOver}
              isImporting={isImporting}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDomDrop}
            />

            {message && <p className="text-[11px] text-slate-500 dark:text-slate-400">{message}</p>}

            {/* 损坏壁纸告警 */}
            {isWallpaperLoadFailed && activeWallpaper && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  当前壁纸文件无法读取，已回退到渐变色。可移除损坏项后重新导入。
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemove(activeWallpaper.id)}
                  className="shrink-0 rounded-md px-2 py-1 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer"
                >
                  移除损坏项
                </button>
              </div>
            )}

            {/* 壁纸图库缩略图网格 */}
            <WallpaperGallery
              wallpaperImages={wallpaperImages}
              activeWallpaper={activeWallpaper}
              isWallpaperLoadFailed={isWallpaperLoadFailed}
              onSelectWallpaper={selectWallpaper}
              onRemoveWallpaper={handleRemove}
            />

            {/* 当已选中有效壁纸时：参数调节与游乐场入口 */}
            {activeWallpaper && !isWallpaperLoadFailed && (
              <div className="space-y-4">
                <WallpaperControls
                  wallpaperOpacity={wallpaperOpacity}
                  wallpaperBlur={wallpaperBlur}
                  wallpaperFit={wallpaperFit}
                  isPlaygroundOpen={isPlaygroundOpen}
                  onSetWallpaperOpacity={setWallpaperOpacity}
                  onSetWallpaperBlur={setWallpaperBlur}
                  onSetWallpaperFit={setWallpaperFit}
                  onTogglePlayground={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                />

                {/* 二级抽屉动画展开：图层覆盖调试游乐场 */}
                <AnimatePresence>
                  {isPlaygroundOpen && (
                    <WallpaperPlaygroundDrawer
                      isOpen={isPlaygroundOpen}
                      onClose={() => setIsPlaygroundOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PaperCard>
  );
};
