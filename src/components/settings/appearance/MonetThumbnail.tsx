/**
 * @file MonetThumbnail.tsx
 * @description 莫奈画廊持久化缩略图组件（优先走 Tauri asset 协议，失败时回退后端 DataURL 读取）
 */

import React, { useState, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { configApi } from "../../../services/configApi";

export const MonetThumbnail: React.FC<{ imagePath: string; alt: string }> = ({
  imagePath,
  alt,
}) => {
  const [src, setSrc] = useState<string>(() => {
    try {
      return convertFileSrc(imagePath);
    } catch {
      return imagePath;
    }
  });
  const [fallbackTried, setFallbackTried] = useState(false);

  useEffect(() => {
    setFallbackTried(false);
    try {
      setSrc(convertFileSrc(imagePath));
    } catch {
      setSrc(imagePath);
    }
  }, [imagePath]);

  const handleError = async () => {
    if (fallbackTried) return;
    setFallbackTried(true);
    try {
      const dataUrl = await configApi.readImageAsDataUrl(imagePath);
      setSrc(dataUrl);
    } catch {
      // 忽略异常
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
      loading="lazy"
    />
  );
};
