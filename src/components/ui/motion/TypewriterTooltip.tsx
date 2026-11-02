import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface TypewriterTooltipProps {
  children: React.ReactNode;
  content?: string;
  text?: string; // 别名支持 text / content
  speed?: number; // 字符打字间隔 (ms)
  delayMs?: number; // 悬浮延迟触发 (ms)
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const TypewriterTooltip: React.FC<TypewriterTooltipProps> = ({
  children,
  content,
  text,
  speed = 18,
  delayMs = 0,
  position = "top",
  className = "",
}) => {
  const targetText = text ?? content ?? "";
  const [isVisible, setIsVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (delayMs > 0) {
      delayTimerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);
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
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVisible, targetText, speed]);

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "top":
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && targetText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: position === "top" ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === "top" ? 4 : -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className={`absolute z-50 pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900/95 text-white border border-slate-700/80 shadow-xl backdrop-blur-md text-[11px] font-sans flex items-center gap-1.5 ${getPositionClasses()}`}
          >
            <span>{displayedText}</span>
            {isTyping && (
              <span className="inline-block w-1 h-3 bg-cyan-400 animate-pulse rounded-xs" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};