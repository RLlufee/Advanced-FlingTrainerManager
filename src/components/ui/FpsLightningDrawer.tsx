import React, { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";
import { useAnimationConfig } from "./motion/AnimationContext";

export const FpsLightningDrawer: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [fps, setFps] = useState<number>(60);
  const [frameTime, setFrameTime] = useState<number>(16.6);

  const { targetFps, cycleTargetFps } = useAnimationConfig();

  // 防抖收缩定时器
  const hideTimerRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameHistoryRef = useRef<number[]>([]);
  const lastUiUpdateRef = useRef<number>(0);

  // 当鼠标悬停展开时，激活高精度 requestAnimationFrame 帧率采样
  useEffect(() => {
    if (!isHovered) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();
    frameHistoryRef.current = [];

    const loop = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0 && delta < 1000) {
        frameHistoryRef.current.push(delta);
        if (frameHistoryRef.current.length > 20) {
          frameHistoryRef.current.shift();
        }

        // 每隔 120ms 更新一次 UI 数据，避免数字剧烈频闪
        if (now - lastUiUpdateRef.current > 120) {
          const avgDelta =
            frameHistoryRef.current.reduce((a, b) => a + b, 0) /
            frameHistoryRef.current.length;
          const currentFps = Math.min(360, Math.round(1000 / avgDelta));
          setFps(currentFps);
          setFrameTime(parseFloat(avgDelta.toFixed(1)));
          lastUiUpdateRef.current = now;
        }
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isHovered]);

  const handleMouseEnter = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    // 250ms 平滑防抖缩回
    hideTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cycleTargetFps();
  };

  // 帧率状态颜色
  const getFpsColor = () => {
    if (fps >= 55) return "text-emerald-400 bg-emerald-400";
    if (fps >= 30) return "text-amber-300 bg-amber-300";
    return "text-rose-400 bg-rose-400";
  };

  const getTargetFpsBadge = () => {
    if (targetFps === 0) return "极速";
    return `${targetFps}Hz`;
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`h-8 flex items-center rounded-full transition-all duration-300 ease-out cursor-pointer select-none mr-1.5 active:scale-95 ${
        isHovered
          ? "bg-black/55 backdrop-blur-md border border-white/25 px-2.5 shadow-lg"
          : "bg-white/10 hover:bg-white/15 border border-white/10 px-2"
      }`}
      title={`当前帧率: ${fps} FPS · 目标: ${getTargetFpsBadge()} (点击切换 60/90/120/144/极速)`}
    >
      {/* 旋转的闪电图标 */}
      <div
        className={`flex items-center justify-center transition-transform ${
          isHovered
            ? "animate-[spin_1.5s_linear_infinite]"
            : "animate-[spin_4s_linear_infinite]"
        }`}
      >
        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40 drop-shadow-[0_0_6px_rgba(252,211,77,0.7)]" />
      </div>

      {/* 抽屉弹出内容区域 */}
      <div
        className={`flex items-center overflow-hidden transition-all duration-300 ease-out ${
          isHovered ? "max-w-[170px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0"
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium whitespace-nowrap text-white/90">
          {/* 状态呼吸灯圆点 */}
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-xs ${
              getFpsColor().split(" ")[1]
            }`}
          />
          <span className={getFpsColor().split(" ")[0]}>{fps}</span>
          <span className="text-[10px] text-white/50">FPS</span>
          <span className="text-white/30 text-[10px]">·</span>
          <span className="text-[11px] text-white/80">{frameTime}</span>
          <span className="text-[10px] text-white/50">ms</span>

          {/* 目标档位胶囊标记 (可点击切换) */}
          <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-sans font-bold bg-white/15 text-cyan-200 border border-white/20 hover:bg-white/25 transition-colors">
            {getTargetFpsBadge()}
          </span>
        </div>
      </div>
    </div>
  );
};
