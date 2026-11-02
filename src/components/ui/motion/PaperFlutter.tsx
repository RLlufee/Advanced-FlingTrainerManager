import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

export interface PaperContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const PaperContainer: React.FC<PaperContainerProps> = ({
  children,
  staggerDelay = 0.06,
  className = "",
  ...props
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.02,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface PaperCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  tiltAngle?: number;
  className?: string;
  delayIndex?: number;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  children,
  tiltAngle = 1.8,
  className = "",
  delayIndex = 0,
  ...props
}) => {
  // 模拟纸片飘扬着从空中轻盈落下的物理轨迹（交替微倾斜与 3D 透视）
  const initialRotateZ = delayIndex % 2 === 0 ? -tiltAngle : tiltAngle;

  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: 35,
          rotateX: 14,
          rotateZ: initialRotateZ,
          scale: 0.95,
        },
        show: {
          opacity: 1,
          y: 0,
          rotateX: 0,
          rotateZ: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 260,
            damping: 22,
            mass: 0.85,
          },
        },
      }}
      whileHover={{
        y: -3,
        rotateX: -2,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className={`transform-gpu ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
