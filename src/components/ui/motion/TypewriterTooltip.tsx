import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAnimationConfig } from "./AnimationContext";

export interface TypewriterTooltipProps {
  children: React.ReactNode;
  content?: string;
  text?: string; // 别名支持 text / content
  speed?: number; // 字符打字间隔 (ms)
  delayMs?: number; // 悬浮延迟触发 (ms)
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  maxWidth?: number; // 最大宽度 (px)，默认 300
}

interface Coords {
  top?: number;
  bottom?: number;
  left: number;
  actualPos: "top" | "bottom" | "left" | "right";
  arrowOffset: number;
}

export const TypewriterTooltip: React.FC<TypewriterTooltipProps> = ({
  children,
  content,
  text,
  speed,
  delayMs = 0,
  position = "top",
  className = "",
  maxWidth = 300,
}) => {
  const { effectiveTypewriterSpeed, isAnimEnabled, effectiveSpeed } = useAnimationConfig();
  const targetText = text ?? content ?? "";
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const actualSpeed = speed ?? effectiveTypewriterSpeed;

  // 计算并夹逼气泡坐标，绝对防止超出窗口视口边界 (Viewport Safety Clamping)
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const PADDING = 12; // 距窗口边界最小安全距离
    const GAP = 8; // 气泡距触发元素的安全间距

    const tooltipWidth = tooltipRef.current?.offsetWidth || Math.min(maxWidth, 260);
    const tooltipHeight = tooltipRef.current?.offsetHeight || 44;

    let actualPos = position;

    // 1. 垂直方向边缘越界检测与自适应翻转 (Auto-Flip)
    if (position === "top" && triggerRect.top - tooltipHeight - GAP < PADDING) {
      actualPos = "bottom";
    } else if (position === "bottom" && triggerRect.bottom + tooltipHeight + GAP > viewportHeight - PADDING) {
      actualPos = "top";
    }

    // 2. 水平方向边缘越界检测与翻转
    if (position === "left" && triggerRect.left - tooltipWidth - GAP < PADDING) {
      actualPos = triggerRect.right + tooltipWidth + GAP <= viewportWidth - PADDING ? "right" : "bottom";
    } else if (position === "right" && triggerRect.right + tooltipWidth + GAP > viewportWidth - PADDING) {
      actualPos = triggerRect.left - tooltipWidth - GAP >= PADDING ? "left" : "bottom";
    }

    let idealX = 0;
    let idealY = 0;

    if (actualPos === "top") {
      idealX = triggerRect.left + triggerRect.width / 2;
      idealY = triggerRect.top - GAP;
    } else if (actualPos === "bottom") {
      idealX = triggerRect.left + triggerRect.width / 2;
      idealY = triggerRect.bottom + GAP;
    } else if (actualPos === "left") {
      idealX = triggerRect.left - GAP - tooltipWidth / 2;
      idealY = triggerRect.top + triggerRect.height / 2;
    } else {
      idealX = triggerRect.right + GAP + tooltipWidth / 2;
      idealY = triggerRect.top + triggerRect.height / 2;
    }

    // 3. 水平安全夹逼（保证气泡 100% 落在窗口可视区域内）
    const minX = PADDING + tooltipWidth / 2;
    const maxX = viewportWidth - PADDING - tooltipWidth / 2;
    const clampedX = Math.max(minX, Math.min(maxX, idealX));
    const arrowOffset = Math.max(-tooltipWidth / 2 + 16, Math.min(tooltipWidth / 2 - 16, idealX - clampedX));

    if (actualPos === "top") {
      setCoords({
        bottom: viewportHeight - idealY,
        left: clampedX,
        actualPos,
        arrowOffset,
      });
    } else if (actualPos === "bottom") {
      setCoords({
        top: idealY,
        left: clampedX,
        actualPos,
        arrowOffset,
      });
    } else {
      const clampedY = Math.max(
        PADDING + tooltipHeight / 2,
        Math.min(viewportHeight - PADDING - tooltipHeight / 2, idealY)
      );
      setCoords({
        top: clampedY,
        left: clampedX,
        actualPos,
        arrowOffset,
      });
    }
  }, [position, maxWidth]);

  const handleMouseEnter = () => {
    if (delayMs > 0 && isAnimEnabled) {
      delayTimerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayMs / effectiveSpeed);
    } else {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    setIsVisible(false);
  };

  // 显隐或尺寸变化时重新计算视口位置
  useLayoutEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  // 监听页面滚动与窗口缩放，实时修正浮标锚点
  useEffect(() => {
    if (!isVisible) return;
    const onScrollOrResize = () => calculatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isVisible, calculatePosition]);

  // 打字机流式输出动画
  useEffect(() => {
    if (!isVisible || !targetText) {
      setDisplayedText("");
      setIsTyping(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!isAnimEnabled || actualSpeed <= 0) {
      setDisplayedText(targetText);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    let currentIndex = 0;
    setDisplayedText("");

    timerRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex <= targetText.length) {
        setDisplayedText(targetText.slice(0, currentIndex));
      } else {
        setIsTyping(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, actualSpeed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVisible, targetText, actualSpeed, isAnimEnabled]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isVisible && targetText && coords && (
              <motion.div
                ref={tooltipRef}
                initial={
                  isAnimEnabled
                    ? {
                        opacity: 0,
                        scale: 0.88,
                        y: coords.actualPos === "top" ? 6 : -6,
                      }
                    : { opacity: 1 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  isAnimEnabled
                    ? {
                        opacity: 0,
                        scale: 0.9,
                        y: coords.actualPos === "top" ? 4 : -4,
                      }
                    : { opacity: 0 }
                }
                transition={
                  isAnimEnabled
                    ? {
                        type: "spring",
                        stiffness: Math.round(480 * effectiveSpeed),
                        damping: 26,
                      }
                    : { duration: 0 }
                }
                style={{
                  position: "fixed",
                  zIndex: 99999,
                  maxWidth: `${maxWidth}px`,
                  ...(coords.top !== undefined ? { top: coords.top } : {}),
                  ...(coords.bottom !== undefined ? { bottom: coords.bottom } : {}),
                  left: coords.left,
                  transform:
                    coords.actualPos === "left" || coords.actualPos === "right"
                      ? "translate(-50%, -50%)"
                      : "translateX(-50%)",
                }}
                className="pointer-events-none px-3 py-2 rounded-xl bg-slate-900/95 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] font-sans leading-relaxed whitespace-normal break-words flex items-start gap-1.5 select-none"
              >
                <div className="flex-1">
                  <span>{displayedText}</span>
                  {isTyping && (
                    <span className="inline-block w-1 h-3 bg-cyan-400 animate-pulse rounded-xs ml-0.5 align-middle" />
                  )}
                </div>

                {/* 居中或补偿对准触发器的指向小箭头 */}
                {coords.actualPos === "top" && (
                  <div
                    style={{
                      left: `calc(50% + ${coords.arrowOffset}px)`,
                      transform: "translateX(-50%) rotate(45deg)",
                    }}
                    className="absolute -bottom-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700/80"
                  />
                )}
                {coords.actualPos === "bottom" && (
                  <div
                    style={{
                      left: `calc(50% + ${coords.arrowOffset}px)`,
                      transform: "translateX(-50%) rotate(45deg)",
                    }}
                    className="absolute -top-1 w-2 h-2 bg-slate-900 border-l border-t border-slate-700/80"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
