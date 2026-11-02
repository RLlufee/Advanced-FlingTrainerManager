import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAnimationConfig } from "./AnimationContext";

export interface FluidSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  color?: "cyan" | "amber" | "indigo" | "blue" | "rose" | "purple";
  className?: string;
  disabled?: boolean;
  marks?: Array<{ value: number; label: string }>;
  showFollowerTooltip?: boolean;
  ariaLabel?: string;
}

export const FluidSlider: React.FC<FluidSliderProps> = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  color = "cyan",
  className = "",
  disabled = false,
  marks,
  showFollowerTooltip = true,
  ariaLabel,
}) => {
  const { isAnimEnabled, effectiveSpeed } = useAnimationConfig();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sliderId = useId();

  // 计算百分比并限制在 0 ~ 100 之间
  const rawPercentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const percentage = Math.max(0, Math.min(100, rawPercentage));

  // 浮标提示位置微调：边缘防溢出夹逼 (8% ~ 92%)
  const clampedBadgePercent = Math.max(7, Math.min(93, percentage));
  const arrowOffset = (percentage - clampedBadgePercent) * 1.8;

  const displayValue = formatValue ? formatValue(value) : String(value);
  const showTooltip = showFollowerTooltip && (isHovered || isDragging || isFocused) && !disabled;

  // 主题色预设
  const themeStyles = {
    cyan: {
      fill: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 shadow-sm shadow-cyan-500/25",
      thumbBorder: "border-cyan-500",
      thumbRing: "ring-cyan-400/30",
      badgeBorder: "border-cyan-500/30",
      badgeText: "text-cyan-300",
    },
    amber: {
      fill: "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-sm shadow-amber-500/25",
      thumbBorder: "border-amber-500",
      thumbRing: "ring-amber-400/30",
      badgeBorder: "border-amber-500/30",
      badgeText: "text-amber-300",
    },
    indigo: {
      fill: "bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/25",
      thumbBorder: "border-indigo-500",
      thumbRing: "ring-indigo-400/30",
      badgeBorder: "border-indigo-500/30",
      badgeText: "text-indigo-300",
    },
    blue: {
      fill: "bg-gradient-to-r from-blue-500 via-blue-600 to-sky-600 shadow-sm shadow-blue-500/25",
      thumbBorder: "border-blue-500",
      thumbRing: "ring-blue-400/30",
      badgeBorder: "border-blue-500/30",
      badgeText: "text-blue-300",
    },
    rose: {
      fill: "bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 shadow-sm shadow-rose-500/25",
      thumbBorder: "border-rose-500",
      thumbRing: "ring-rose-400/30",
      badgeBorder: "border-rose-500/30",
      badgeText: "text-rose-300",
    },
    purple: {
      fill: "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-violet-600 shadow-sm shadow-purple-500/25",
      thumbBorder: "border-purple-500",
      thumbRing: "ring-purple-400/30",
      badgeBorder: "border-purple-500/30",
      badgeText: "text-purple-300",
    },
  }[color];

  return (
    <div
      className={`relative w-full select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isFocused) setIsDragging(false);
      }}
    >
      {/* 随滑块移动的动态浮标提示 (Follower Floating Tooltip) */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={
              isAnimEnabled
                ? { opacity: 0, scale: 0.84, y: 6 }
                : { opacity: 1 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              isAnimEnabled
                ? { opacity: 0, scale: 0.88, y: 4 }
                : { opacity: 0 }
            }
            transition={
              isAnimEnabled
                ? {
                    type: "spring",
                    stiffness: Math.round(500 * effectiveSpeed),
                    damping: 26,
                  }
                : { duration: 0 }
            }
            style={{
              left: `${clampedBadgePercent}%`,
              transform: "translateX(-50%)",
            }}
            className={`absolute -top-8 z-30 pointer-events-none px-2.5 py-0.5 rounded-lg bg-slate-900/95 text-white text-[11px] font-mono font-bold shadow-xl border ${themeStyles.badgeBorder} backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap`}
          >
            <span className={themeStyles.badgeText}>{displayValue}</span>
            {/* 箭头指向滑块圆钮 */}
            <div
              style={{
                left: `calc(50% + ${arrowOffset}px)`,
                transform: "translateX(-50%) rotate(45deg)",
              }}
              className={`absolute -bottom-1 w-2 h-2 bg-slate-900 border-r border-b ${themeStyles.badgeBorder}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 滑块主轨道与交互层 */}
      <div className="relative py-2.5 flex items-center">
        {/* 背景轨道槽 */}
        <div className="w-full h-2 bg-slate-200/90 rounded-full relative overflow-hidden shadow-inner">
          {/* 已激活进度填充 */}
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full transition-all duration-75 ${themeStyles.fill}`}
          />
        </div>

        {/* 动态圆钮 Thumb */}
        <motion.div
          animate={
            isAnimEnabled
              ? {
                  scale: isDragging ? 1.25 : isHovered || isFocused ? 1.15 : 1,
                  boxShadow:
                    isDragging || isHovered
                      ? "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 4px rgba(6, 182, 212, 0.2)"
                      : "0 2px 6px rgba(0, 0, 0, 0.1)",
                }
              : {}
          }
          transition={
            isAnimEnabled
              ? {
                  type: "spring",
                  stiffness: Math.round(450 * effectiveSpeed),
                  damping: 24,
                }
              : { duration: 0 }
          }
          style={{
            left: `${percentage}%`,
            transform: "translateX(-50%)",
          }}
          className={`absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full bg-white border-2 ${themeStyles.thumbBorder} pointer-events-none z-10`}
        />

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
          aria-valuenow={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setIsDragging(false);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
        />
      </div>

      {/* 刻度文字或标尺 */}
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
