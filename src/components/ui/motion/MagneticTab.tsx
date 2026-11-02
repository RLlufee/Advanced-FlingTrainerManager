import React, { useRef, useState } from "react";
import { motion } from "motion/react";

export interface MagneticTabProps {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  layoutId?: string;
  className?: string;
  activePillClassName?: string;
}

export const MagneticTab: React.FC<MagneticTabProps> = ({
  children,
  isActive,
  onClick,
  layoutId = "active-tab-pill",
  className = "",
  activePillClassName = "bg-white text-slate-900 shadow-md",
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    // 磁吸位移强度 (最大偏离 3.5px，细腻而不突兀)
    const distanceX = (clientX - centerX) * 0.18;
    const distanceY = (clientY - centerY) * 0.18;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 350, damping: 20, mass: 0.5 }}
      whileTap={{ scale: 0.94 }}
      className={`relative px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer select-none transition-colors duration-150 flex items-center gap-1.5 z-10 ${
        isActive ? "text-slate-900 font-semibold" : "text-slate-300 hover:text-white"
      } ${className}`}
    >
      {isActive && (
        <motion.div
          layoutId={layoutId}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 30,
          }}
          className={`absolute inset-0 rounded-full -z-10 ${activePillClassName}`}
        />
      )}
      {children}
    </motion.button>
  );
};
