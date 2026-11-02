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

type Placement = "top" | "bottom" | "left" | "right";

/**
 * 气泡最终坐标（全部是视口坐标系下的“左上角”像素值）。
 * 不再使用 translate(-50%) 居中 —— motion 在做 scale / y 动画时会接管 transform，
 * 旧实现里写在 style.transform 上的 translateX(-50%) 会被覆盖掉，导致气泡整体右偏半个身位、
 * 依然突出窗口。直接算好左上角就彻底没有这个问题。
 */
interface Coords {
  x: number;
  y: number;
  placement: Placement;
  /** 箭头在气泡内部的位置：top/bottom 时为距左边 px，left/right 时为距顶边 px */
  arrow: number;
}

const PADDING = 12; // 距窗口边界最小安全距离
const GAP = 8; // 气泡距触发元素的间距
const ARROW_EDGE_MIN = 12; // 箭头距气泡边缘的最小距离（避开圆角）

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

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

  /**
   * 计算气泡位置。
   * 关键：气泡里始终按“完整文本”排版（未打出的部分用 invisible 占位），
   * 所以这里量到的就是最终尺寸，打字过程中气泡不会变宽变高、也不会越打越往外突。
   */
  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tip = tooltipRef.current;
    if (!trigger || !tip) return;

    const t = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // offsetWidth/Height 不受 scale 动画影响，量到的是真实布局尺寸
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    // 1. 选定方向：首选方向放不下时翻转到对侧；对侧也放不下就挑空间更大的一侧
    const room = {
      top: t.top - GAP - PADDING,
      bottom: vh - t.bottom - GAP - PADDING,
      left: t.left - GAP - PADDING,
      right: vw - t.right - GAP - PADDING,
    };
    const need = { top: h, bottom: h, left: w, right: w };
    const opposite: Record<Placement, Placement> = { top: "bottom", bottom: "top", left: "right", right: "left" };

    let placement: Placement = position;
    if (room[placement] < need[placement]) {
      const alt = opposite[placement];
      if (room[alt] >= need[alt]) {
        placement = alt;
      } else if (placement === "left" || placement === "right") {
        // 左右都放不下（窄窗口 + 长文本）→ 退回上下方向
        placement = room.bottom >= room.top ? "bottom" : "top";
      } else if (room[alt] > room[placement]) {
        placement = alt;
      }
    }

    // 2. 理想左上角坐标
    const cx = t.left + t.width / 2;
    const cy = t.top + t.height / 2;
    let x: number;
    let y: number;
    switch (placement) {
      case "top":
        x = cx - w / 2;
        y = t.top - GAP - h;
        break;
      case "bottom":
        x = cx - w / 2;
        y = t.bottom + GAP;
        break;
      case "left":
        x = t.left - GAP - w;
        y = cy - h / 2;
        break;
      case "right":
      default:
        x = t.right + GAP;
        y = cy - h / 2;
        break;
    }

    // 3. 视口夹逼：保证气泡完整落在窗口内
    x = clamp(x, PADDING, Math.max(PADDING, vw - PADDING - w));
    y = clamp(y, PADDING, Math.max(PADDING, vh - PADDING - h));

    // 4. 箭头补偿：气泡被推开后，箭头仍然指向触发元素中心
    const arrow =
      placement === "top" || placement === "bottom"
        ? clamp(cx - x, ARROW_EDGE_MIN, w - ARROW_EDGE_MIN)
        : clamp(cy - y, ARROW_EDGE_MIN, h - ARROW_EDGE_MIN);

    setCoords((prev) =>
      prev &&
      prev.x === x &&
      prev.y === y &&
      prev.placement === placement &&
      prev.arrow === arrow
        ? prev
        : { x, y, placement, arrow }
    );
  }, [position]);

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

  // 卸载时清理延迟定时器
  useEffect(() => {
    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    };
  }, []);

  // 显示时（气泡已挂载、尚未绘制）同步测量并定位，首帧即在正确位置
  useLayoutEffect(() => {
    // 隐藏时保留旧坐标，让退场动画留在原地播放；再次显示时会在绘制前被重新计算覆盖
    if (isVisible) calculatePosition();
  }, [isVisible, targetText, calculatePosition]);

  // 监听页面滚动与窗口缩放，实时修正位置
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

    // 若动效关闭或打字间隔设为 0，瞬间显示完整文本
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

  // 根据方向决定弹出位移与缩放原点（原点放在箭头处，像从触发元素上“长”出来）
  const placement: Placement = coords?.placement ?? position;
  const offset = 6;
  const enterFrom =
    placement === "top"
      ? { y: offset }
      : placement === "bottom"
        ? { y: -offset }
        : placement === "left"
          ? { x: offset }
          : { x: -offset };
  const exitTo =
    placement === "top"
      ? { y: offset * 0.6 }
      : placement === "bottom"
        ? { y: -offset * 0.6 }
        : placement === "left"
          ? { x: offset * 0.6 }
          : { x: -offset * 0.6 };
  const arrowPx = coords?.arrow ?? 0;
  const transformOrigin =
    placement === "top"
      ? `${arrowPx}px 100%`
      : placement === "bottom"
        ? `${arrowPx}px 0%`
        : placement === "left"
          ? `100% ${arrowPx}px`
          : `0% ${arrowPx}px`;

  const remainingText = targetText.slice(displayedText.length);

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
            {isVisible && targetText && (
              <motion.div
                ref={tooltipRef}
                initial={isAnimEnabled ? { opacity: 0, scale: 0.9, x: 0, y: 0, ...enterFrom } : { opacity: 1 }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={isAnimEnabled ? { opacity: 0, scale: 0.94, ...exitTo } : { opacity: 0 }}
                transition={
                  isAnimEnabled
                    ? {
                        type: "spring",
                        stiffness: Math.round(480 * effectiveSpeed),
                        damping: 28,
                      }
                    : { duration: 0 }
                }
                style={{
                  position: "fixed",
                  zIndex: 99999,
                  left: coords?.x ?? 0,
                  top: coords?.y ?? 0,
                  // 首次测量前先隐藏，避免左上角闪现
                  visibility: coords ? "visible" : "hidden",
                  // 宽度按内容自适应，但不超过 maxWidth 和窗口可用宽度；
                  // 用 max-content 让测量结果与 left 无关（fixed 元素默认会被右侧剩余空间挤压）
                  width: "max-content",
                  maxWidth: `min(${maxWidth}px, calc(100vw - ${PADDING * 2}px))`,
                  transformOrigin,
                }}
                className="pointer-events-none px-3 py-2 rounded-xl bg-cyan-900/95 text-white border border-cyan-500/40 shadow-xl shadow-primary-glow backdrop-blur-md text-[11px] font-sans leading-relaxed whitespace-normal break-words select-none"
              >
                {/* 已打出的文字 + 零宽光标 + 未打出文字（不可见占位，锁定最终尺寸） */}
                <span>{displayedText}</span>
                {isTyping && (
                  <span className="relative inline-block w-0 h-3 align-middle">
                    <span className="absolute left-0.5 top-0 w-1 h-3 bg-cyan-300 animate-pulse rounded-xs" />
                  </span>
                )}
                {remainingText && (
                  <span className="invisible" aria-hidden>
                    {remainingText}
                  </span>
                )}

                {/* 指向触发元素的小箭头（位置已做夹逼补偿） */}
                {coords && placement === "top" && (
                  <div
                    style={{ left: arrowPx }}
                    className="absolute -bottom-1 w-2 h-2 -translate-x-1/2 rotate-45 bg-cyan-900 border-r border-b border-cyan-500/40"
                  />
                )}
                {coords && placement === "bottom" && (
                  <div
                    style={{ left: arrowPx }}
                    className="absolute -top-1 w-2 h-2 -translate-x-1/2 rotate-45 bg-cyan-900 border-l border-t border-cyan-500/40"
                  />
                )}
                {coords && placement === "left" && (
                  <div
                    style={{ top: arrowPx }}
                    className="absolute -right-1 w-2 h-2 -translate-y-1/2 rotate-45 bg-cyan-900 border-r border-t border-cyan-500/40"
                  />
                )}
                {coords && placement === "right" && (
                  <div
                    style={{ top: arrowPx }}
                    className="absolute -left-1 w-2 h-2 -translate-y-1/2 rotate-45 bg-cyan-900 border-l border-b border-cyan-500/40"
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
