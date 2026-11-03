import React, { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { configApi } from "../services/configApi";
import { useTheme } from "./ui/theme";

export const WallpaperBackdrop: React.FC = () => {
  const {
    activeWallpaper,
    wallpaperOpacity,
    wallpaperBlur,
    wallpaperFit,
    markWallpaperLoadFailed,
  } = useTheme();
  const [source, setSource] = useState("");
  const [fallbackTried, setFallbackTried] = useState(false);

  useEffect(() => {
    setFallbackTried(false);
    if (!activeWallpaper) {
      setSource("");
      return;
    }
    try {
      setSource(convertFileSrc(activeWallpaper.image_path));
    } catch {
      setSource(activeWallpaper.image_path);
    }
  }, [activeWallpaper]);

  const handleImageError = async () => {
    if (!activeWallpaper) return;
    if (!fallbackTried) {
      setFallbackTried(true);
      try {
        const dataUrl = await configApi.readImageAsDataUrl(activeWallpaper.image_path);
        setSource(dataUrl);
        return;
      } catch {
        // 找不到图片时回退到主题渐变，并保留图库条目供用户移除。
      }
    }
    markWallpaperLoadFailed();
  };

  if (!activeWallpaper || !source) return null;

  return (
    <div className="app-wallpaper-layer absolute inset-x-0 bottom-0 top-12 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <img
        key={activeWallpaper.id}
        src={source}
        alt=""
        onError={handleImageError}
        className="h-full w-full"
        style={{
          objectFit: wallpaperFit,
          opacity: wallpaperOpacity / 100,
          filter: `blur(${wallpaperBlur}px)`,
          transform: `scale(${wallpaperBlur > 0 ? 1.04 : 1})`,
        }}
      />
    </div>
  );
};
