import React, { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

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

  // 当候选源发生改变时重置状态
  useEffect(() => {
    setCurrentIdx(0);
    setAllFailed(candidates.length === 0);
    setLoaded(false);
  }, [candidates]);

  const handleError = () => {
    if (currentIdx + 1 < candidates.length) {
      // 优雅降级：切换到备用图片源 (例如 Steam 胶囊图 404 -> 切换 Steam Header -> 切换官网封面)
      setCurrentIdx((prev) => prev + 1);
      setLoaded(false);
    } else {
      // 所有源全部失效，切换至高颜值渐变骨架兜底，绝不展示原生浏览器的破损图标！
      setAllFailed(true);
    }
  };

  // 终极优雅降级占位：科技感暗黑渐变 + 游戏缩写首字母 + 微光手柄图标
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
        <Gamepad2
          className={`${iconClassName} text-cyan-400/80 mb-1 z-10 transition-transform duration-300 group-hover:scale-110`}
        />
        {showInitials && (
          <span className="text-[10px] font-bold tracking-wider font-mono text-slate-300/90 z-10 uppercase px-1">
            {initials}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      {/* 预加载微光占位 */}
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800/50 animate-pulse flex items-center justify-center">
          <Gamepad2 className={`${iconClassName} text-slate-600/40`} />
        </div>
      )}
      <img
        src={candidates[currentIdx]}
        alt="" // 关键：空 alt 防止原生浏览器在容器内渲染原生破损图标与折行文本
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
      />
    </div>
  );
};
