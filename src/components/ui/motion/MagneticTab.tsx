import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { useAnimationConfig } from "./AnimationContext";

export interface MagneticTabProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  layoutId?: string;
  className?: string;
  activePillClassName?: string;
  /** 激活态文字颜色类名（默认深灰，可传入强调色类名以跟随主题） */
  activeTextClassName?: string;
}

export const MagneticTab: React.FC<MagneticTabProps> = ({
  children,
  isActive,
  onClick,
  layoutId = "active-tab-pill",
  className = "",
  activePillClassName = "bg-white text-slate-900 shadow-md",
  activeTextClassName = "text-slate-900",
}) => {
  const { isMagneticEnabled, isAnimEnabled, effectiveSpeed } = useAnimationConfig();
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMagneticEnabled || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    // 磁吸位移强度 (最大偏离约 3.5px，细腻而不突兀)
    const distanceX = (clientX - centerX) * 0.18;
    const distanceY = (clientY - centerY) * 0.18;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    if (position.x !== 0 || position.y !== 0) {
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={isMagneticEnabled ? { x: position.x, y: position.y } : { x: 0, y: 0 }}
      transition={{
        type: "spring",
        stiffness: Math.round(350 * effectiveSpeed),
        damping: 20,
        mass: 0.5,
      }}
      whileTap={isAnimEnabled ? { scale: 0.94 } : undefined}
      className={`relative px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer select-none transition-colors duration-150 flex items-center gap-1.5 z-10 ${
        isActive ? `${activeTextClassName} font-semibold` : "text-slate-300 hover:text-white"
      } ${className}`}
    >
      {isActive && (
        <motion.div
          layoutId={isAnimEnabled ? layoutId : undefined}
          transition={{
            type: "spring",
            stiffness: Math.round(420 * effectiveSpeed),
            damping: 30,
          }}
          className={`absolute inset-0 rounded-full -z-10 ${activePillClassName}`}
        />
      )}
      {children}
    </motion.button>
  );
};