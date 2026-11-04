import React from "react";
import { Check, Trash2 } from "lucide-react";
import { WallpaperSavedImage } from "../../../services/configApi";
import { WallpaperThumbnail } from "./WallpaperThumbnail";

interface WallpaperGalleryProps {
  wallpaperImages: WallpaperSavedImage[];
  activeWallpaper: WallpaperSavedImage | null;
  isWallpaperLoadFailed: boolean;
  onSelectWallpaper: (id: string) => Promise<void>;
  onRemoveWallpaper: (id: string) => Promise<void>;
}

export const WallpaperGallery: React.FC<WallpaperGalleryProps> = ({
  wallpaperImages,
  activeWallpaper,
  isWallpaperLoadFailed,
  onSelectWallpaper,
  onRemoveWallpaper,
}) => {
  if (wallpaperImages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 py-6 text-center text-xs text-slate-400">
        尚未添加壁纸，点击上方按钮或拖入图片即可快速添加喵~
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {wallpaperImages.map((image) => {
        const selected = image.id === activeWallpaper?.id && !isWallpaperLoadFailed;
        return (
          <div
            key={image.id}
            className={`group relative rounded-xl border p-2 transition-all ${
              selected
                ? "border-primary ring-2 ring-primary/40 bg-primary-soft/20 dark:bg-primary-soft/10 shadow-xs"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30"
            }`}
          >
            <button
              type="button"
              onClick={() => void onSelectWallpaper(image.id)}
              className="block w-full cursor-pointer text-left"
              aria-label={`应用壁纸 ${image.name}`}
            >
              <WallpaperThumbnail image={image} />
              <span className="mt-2 flex min-w-0 items-center justify-between gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <span className="truncate" title={image.name}>{image.name}</span>
                {selected && (
                  <span className="flex items-center gap-1 text-[10px] text-primary shrink-0">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  </span>
                )}
              </span>
            </button>
            <button
              type="button"
              title={`删除壁纸 ${image.name}`}
              aria-label={`删除壁纸 ${image.name}`}
              onClick={() => void onRemoveWallpaper(image.id)}
              className="absolute right-2 top-2 rounded-md bg-slate-950/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
