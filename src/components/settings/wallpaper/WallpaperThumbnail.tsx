import React, { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { WallpaperSavedImage, configApi } from "../../../services/configApi";

export const WallpaperThumbnail: React.FC<{ image: WallpaperSavedImage }> = ({ image }) => {
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
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
    </div>
  );
};
