import React, { useState, useEffect } from "react";
import { Gamepad2, RefreshCw } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";

// 格式化图片地址：若是本地文件系统绝对路径，转换为 Tauri 安全 asset 协议
const resolveSrc = (url: string): string => {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("asset://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  try {
    return convertFileSrc(url);
  } catch {
    return url;
  }
};

export interface GamePosterProps {
  primarySrc?: string | null;
  secondarySrc?: string | null;
  tertiarySrc?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  showInitials?: boolean;
}

export const GamePoster: React.FC<GamePosterProps> = ({
  primarySrc,
  secondarySrc,
  tertiarySrc,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "",
  iconClassName = "w-6 h-6",
  showInitials = true,
}) => {
  // 整理有效图片候选队列（自动剔除无效、头像或已知坏链）
  const candidates = React.useMemo(() => {
    const list = [primarySrc, secondarySrc, tertiarySrc].filter(
      (src): src is string =>
        Boolean(
          src &&
            src.trim() &&
            !src.includes("gravatar.com") &&
            !src.includes("avatar") &&
            !src.includes("tooltip-icon") &&
            !src.endsWith(".gif")
        )
    );
    // 去重
    return Array.from(new Set(list));
  }, [primarySrc, secondarySrc, tertiarySrc]);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [allFailed, setAllFailed] = useState<boolean>(candidates.length === 0);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // 当外部候选源发生改变时重置状态
  useEffect(() => {
    setCurrentIdx(0);
    setAllFailed(candidates.length === 0);
    setLoaded(false);
    setIsRetrying(false);
  }, [candidates]);

  const handleError = () => {
    if (currentIdx + 1 < candidates.length) {
      // 自动降级优先：切换到下一个候选备用图片源 (Steam 胶囊 -> Steam Header -> 官网原图)
      setCurrentIdx((prev) => prev + 1);
      setLoaded(false);
    } else {
      // 所有源全部尝试完毕，优雅切换至高颜值渐变兜底，绝不展示原生浏览器的破损图标！
      setAllFailed(true);
      setIsRetrying(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (candidates.length === 0) return;
    setIsRetrying(true);
    setAllFailed(false);
    setLoaded(false);
    setCurrentIdx(0);
    setRetryKey(Date.now());
  };

  // 终极优雅降级占位：科技感暗黑渐变 + 游戏缩写首字母 + 微光手柄图标 + 悬浮可点击重试
  if (allFailed || candidates.length === 0) {
    const initials =
      alt
        .replace(/[:：\-_·()[\]{}|]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "GAME";

    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center select-none bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-950 text-slate-300 relative overflow-hidden group border border-slate-800/80 ${containerClassName}`}
        title={alt}
      >
        <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-60" />

        {/* 默认状态展示：手柄图标与游戏缩写 */}
        <div className="flex flex-col items-center justify-center transition-all duration-200 group-hover:scale-90 group-hover:opacity-20">
          <Gamepad2
            className={`${iconClassName} text-cyan-400/80 mb-1 z-10 transition-transform duration-300`}
          />
          {showInitials && (
            <span className="text-[10px] font-bold tracking-wider font-mono text-slate-300/90 z-10 uppercase px-1">
              {initials}
            </span>
          )}
        </div>

        {/* 悬浮重试浮层（自动降级优先，玩家点击重试后若网络通畅则自动替换） */}
        {candidates.length > 0 && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            title="可能因网络波动未加载成功？点击重试从最高画质源重新获取"
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 z-20 text-cyan-300 hover:text-white cursor-pointer px-1 text-center"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mb-1 text-cyan-400 ${
                isRetrying ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
              }`}
            />
            <span className="text-[10px] font-medium tracking-tight">
              {isRetrying ? "重试中..." : "点击重试"}
            </span>
          </button>
        )}
      </div>
    );
  }

  // 拼接重试时间戳避免命中浏览器缓存中的 404 / 失败状态
  const rawUrl = candidates[currentIdx];
  const finalSrc =
    retryKey > 0
      ? rawUrl.includes("?")
        ? `${rawUrl}&_r=${retryKey}`
        : `${rawUrl}?_r=${retryKey}`
      : rawUrl;

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* 预加载微光占位 */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800/50 animate-pulse flex items-center justify-center">
          <Gamepad2 className={`${iconClassName} text-slate-600/40`} />
        </div>
      )}
      <img
        src={resolveSrc(finalSrc)}
        alt="" // 关键：空 alt 防止原生浏览器在容器内渲染原生破损图标与折行文本
        onLoad={() => {
          setLoaded(true);
          setIsRetrying(false);
        }}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
      />
    </div>
  );
};

