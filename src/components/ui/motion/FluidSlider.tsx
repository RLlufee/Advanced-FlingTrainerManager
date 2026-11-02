import React, { useState, useId, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { motion, useSpring } from "motion/react";
import { useAnimationConfig } from "./AnimationContext";
import { useTheme } from "../theme";

export interface FluidSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  color?: "accent" | "cyan" | "amber" | "indigo" | "blue" | "rose" | "purple";
  className?: string;
  disabled?: boolean;
  marks?: Array<{ value: number; label: string }>;
  showFollowerTooltip?: boolean;
  ariaLabel?: string;
}

/**
 * 圆钮尺寸 (px)。
 * 必须与 index.css 中 `.fluid-slider-input::-webkit-slider-thumb` 的宽度保持一致，
 * 这样原生 range 的命中区域（圆心从 R 走到 W-R）才会和视觉圆钮完全重合。
 */
const THUMB_SIZE = 18;
const THUMB_R = THUMB_SIZE / 2;
/** 浮标允许探出轨道两端的最大距离 (px)，超过则贴边，箭头继续对准圆钮 */
const BADGE_EDGE_OVERFLOW = 6;
/** 箭头距浮标左右边缘的最小距离 (px)，避免箭头跑到圆角外面 */
const ARROW_EDGE_MIN = 8;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// 主题色预设（ring 为圆钮外发光的 rgba，避免全部写死成青色）
const THEMES = {
  cyan: {
    fill: "bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-700",
    thumbBorder: "border-cyan-500",
    ring: "6, 182, 212",
    badgeBorder: "border-cyan-500/40",
    badgeText: "text-cyan-300",
  },
  amber: {
    fill: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
    thumbBorder: "border-amber-500",
    ring: "245, 158, 11",
    badgeBorder: "border-amber-500/40",
    badgeText: "text-amber-300",
  },
  indigo: {
    fill: "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600",
    thumbBorder: "border-indigo-500",
    ring: "99, 102, 241",
    badgeBorder: "border-indigo-500/40",
    badgeText: "text-indigo-300",
  },
  blue: {
    fill: "bg-gradient-to-r from-blue-500 via-blue-600 to-sky-600",
    thumbBorder: "border-blue-500",
    ring: "59, 130, 246",
    badgeBorder: "border-blue-500/40",
    badgeText: "text-blue-300",
  },
  rose: {
    fill: "bg-gradient-to-r from-rose-500 via-pink-500 to-red-500",
    thumbBorder: "border-rose-500",
    ring: "244, 63, 94",
    badgeBorder: "border-rose-500/40",
    badgeText: "text-rose-300",
  },
  purple: {
    fill: "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-violet-600",
    thumbBorder: "border-purple-500",
    ring: "168, 85, 247",
    badgeBorder: "border-purple-500/40",
    badgeText: "text-purple-300",
  },
} as const;

/**
 * 流体滑块
 *
 * 设计要点：
 * 1. 原生 <input type="range"> 透明覆盖在最上层，负责鼠标/键盘/无障碍交互；
 * 2. 视觉位置用一个弹簧 (useSpring) 追赶“真实值”，所以无论是拖动、点击轨道跳转，
 *    还是步进很粗（例如 1~4 层）的滑块，圆钮都会平滑滑过去，而不是一格一格地跳；
 * 3. 圆钮 / 填充条 / 浮标三者每帧由同一个弹簧值驱动，直接写 DOM 样式，
 *    不经过 React 重渲染，也不和 motion 的 transform 合成互相覆盖；
 * 4. 浮标始终跟随圆钮，靠近两端时浮标本体贴边，箭头仍然精确指向圆钮。
 */
export const FluidSlider: React.FC<FluidSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  color = "accent",
  className = "",
  disabled = false,
  marks,
  showFollowerTooltip = true,
  ariaLabel,
}) => {
  const { isAnimEnabled, effectiveSpeed } = useAnimationConfig();
  const { currentAccent } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const sliderId = useId();

  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const badgeAnchorRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const theme =
    color !== "accent" && THEMES[color as keyof typeof THEMES]
      ? THEMES[color as keyof typeof THEMES]
      : {
          fill: "bg-primary",
          fillGradient: currentAccent.gradient,
          thumbBorder: "border-primary",
          ring: currentAccent.rgb,
          badgeBorder: "border-primary-border",
          badgeText: "text-primary",
        };

  // 目标百分比 (0 ~ 100)
  const rawPercentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const percentage = clamp(rawPercentage, 0, 100);

  // 滑块自身的跟手弹簧：速度倍率只做温和缩放（0.7x ~ 1.6x），
  // 避免在“全局速度倍率”调到 0.25x 时，滑块本身也变得拖泥带水。
  // 时间尺度 ∝ sqrt(m/k)，想快 s 倍 → k 乘 s²、阻尼乘 s，保持阻尼比不变。
  const s = clamp(effectiveSpeed, 0.7, 1.6);
  const pct = useSpring(percentage, {
    stiffness: 420 * s * s,
    damping: 34 * s,
    mass: 0.7,
  });

  // 根据当前弹簧值，把圆钮 / 填充 / 浮标 / 箭头一次性摆到位
  const applyLayout = useCallback((p: number) => {
    const track = trackRef.current;
    if (!track) return;
    const W = track.clientWidth;
    // 圆心可移动范围 [R, W-R]，与原生 range 的命中映射一致
    const cx = THUMB_R + (W - THUMB_SIZE) * (clamp(p, 0, 100) / 100);

    if (fillRef.current) fillRef.current.style.width = `${cx}px`;
    if (thumbRef.current) thumbRef.current.style.transform = `translate3d(${cx - THUMB_R}px, -50%, 0)`;

    const anchor = badgeAnchorRef.current;
    const badge = badgeRef.current;
    if (anchor && badge) {
      const bw = badge.offsetWidth; // offsetWidth 不受 scale 动画影响
      const bx = clamp(cx - bw / 2, -BADGE_EDGE_OVERFLOW, W - bw + BADGE_EDGE_OVERFLOW);
      const arrowX = clamp(cx - bx, ARROW_EDGE_MIN, bw - ARROW_EDGE_MIN);
      anchor.style.transform = `translate3d(${bx}px, 0, 0)`;
      // 缩放原点放在箭头处，弹出时像是从圆钮上“冒”出来
      badge.style.transformOrigin = `${arrowX}px 100%`;
      if (arrowRef.current) arrowRef.current.style.left = `${arrowX}px`;
    }
  }, []);

  // 值变化 → 驱动弹簧（关闭动效时直接瞬移）
  useEffect(() => {
    if (isAnimEnabled) pct.set(percentage);
    else pct.jump(percentage);
  }, [percentage, isAnimEnabled, pct]);

  // 订阅弹簧每一帧
  useEffect(() => pct.on("change", applyLayout), [pct, applyLayout]);

  // 首帧、文案变化（浮标宽度变化）时同步一次布局，避免闪一下错位
  const displayValue = formatValue ? formatValue(value) : String(value);
  useLayoutEffect(() => {
    applyLayout(pct.get());
  }, [displayValue, applyLayout, pct]);

  // 容器尺寸变化（窗口缩放 / 侧栏折叠）时重新布局
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => applyLayout(pct.get()));
    ro.observe(track);
    return () => ro.disconnect();
  }, [applyLayout, pct]);

  // 拖动结束：在 window 上监听，鼠标拖出滑块区域再松开也能正确收尾
  useEffect(() => {
    if (!isDragging) return;
    const end = () => setIsDragging(false);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [isDragging]);

  // 仅在 悬停 / 拖动 / 键盘聚焦 时显示浮标。
  // 注意：鼠标点击产生的普通 focus 不算，否则点完移开鼠标浮标还一直挂着。
  const showTooltip = showFollowerTooltip && !disabled && (isHovered || isDragging || isFocusVisible);
  const active = !disabled && (isDragging || isHovered || isFocusVisible);

  const popTransition = isAnimEnabled
    ? { type: "spring" as const, stiffness: 560 * s * s, damping: 32 * s, mass: 0.6 }
    : { duration: 0 };

  return (
    <div className={`relative w-full select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <div
        ref={trackRef}
        className="relative h-6 flex items-center"
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* 跟随浮标：外层锚点负责水平位移（DOM 直写），内层 motion 只负责弹出动画 */}
        <div
          ref={badgeAnchorRef}
          className="absolute left-0 bottom-full mb-1 z-30 pointer-events-none will-change-transform"
          aria-hidden
        >
          <motion.div
            ref={badgeRef}
            initial={false}
            animate={
              showTooltip
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: isAnimEnabled ? 0.8 : 1, y: isAnimEnabled ? 4 : 0 }
            }
            transition={popTransition}
            className={`relative px-2 py-0.5 rounded-md bg-cyan-900/95 text-[11px] font-mono font-bold shadow-lg border ${theme.badgeBorder} whitespace-nowrap`}
          >
            <span className={theme.badgeText}>{displayValue}</span>
            {/* 指向圆钮的小箭头（left 由 applyLayout 写入） */}
            <div
              ref={arrowRef}
              className={`absolute top-full -mt-1 w-2 h-2 -translate-x-1/2 rotate-45 bg-cyan-900 border-r border-b ${theme.badgeBorder}`}
            />
          </motion.div>
        </div>

        {/* 背景轨道槽 */}
        <div className="absolute inset-x-0 h-2 bg-slate-200/90 rounded-full overflow-hidden shadow-inner">
          {/* 已激活填充（width 由 applyLayout 写入） */}
          <div
            ref={fillRef}
            className={`h-full rounded-full ${theme.fill}`}
            style={{
              width: THUMB_R,
              background: "fillGradient" in theme && theme.fillGradient ? theme.fillGradient : undefined,
            }}
          />
        </div>

        {/* 圆钮：外层负责位移（DOM 直写），内层 motion 负责缩放与光晕 */}
        <div
          ref={thumbRef}
          className="absolute left-0 top-1/2 z-10 pointer-events-none will-change-transform"
          style={{ width: THUMB_SIZE, height: THUMB_SIZE, transform: "translate3d(0, -50%, 0)" }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: !isAnimEnabled ? 1 : isDragging ? 1.22 : active ? 1.1 : 1,
              boxShadow: active
                ? `0 3px 10px rgba(0,0,0,0.15), 0 0 0 ${isDragging ? 5 : 4}px rgba(${theme.ring}, ${isDragging ? 0.28 : 0.18})`
                : `0 1px 4px rgba(0,0,0,0.12), 0 0 0 0px rgba(${theme.ring}, 0)`,
            }}
            transition={popTransition}
            className={`w-full h-full rounded-full bg-white border-2 ${theme.thumbBorder}`}
          />
        </div>

        {/* 原生隐藏滑动控件：确保系统级手势、键盘无障碍及拖拽事件完整响应 */}
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-valuetext={displayValue}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => setIsDragging(true)}
          onFocus={(e) => {
            // 仅键盘导航产生的焦点才常驻显示浮标
            let fv = false;
            try {
              fv = e.currentTarget.matches(":focus-visible");
            } catch {
              fv = false;
            }
            setIsFocusVisible(fv);
          }}
          onBlur={() => setIsFocusVisible(false)}
          className="fluid-slider-input absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
        />
      </div>

      {/* 刻度文字 */}
      {marks && marks.length > 0 && (
        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
          {marks.map((mark, idx) => (
            <span key={idx}>{mark.label}</span>
          ))}
        </div>
      )}
    </div>
  );
};
