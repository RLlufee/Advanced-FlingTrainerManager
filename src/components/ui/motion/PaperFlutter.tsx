import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { useAnimationConfig } from "./AnimationContext";

export interface PaperContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const PaperContainer: React.FC<PaperContainerProps> = ({
  children,
  staggerDelay = 0.05,
  className = "",
  ...props
}) => {
  const { isPaperFlutterEnabled, effectiveSpeed } = useAnimationConfig();

  const computedStagger = isPaperFlutterEnabled ? staggerDelay / effectiveSpeed : 0;
  const computedDelay = isPaperFlutterEnabled ? 0.02 / effectiveSpeed : 0;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: isPaperFlutterEnabled ? 0 : 1 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: computedStagger,
            delayChildren: computedDelay,
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
  const { isPaperFlutterEnabled, effectiveSpeed } = useAnimationConfig();
  // 模拟纸片飘扬着从空中轻盈落下的物理轨迹（交替微倾斜与 3D 透视）
  const initialRotateZ = delayIndex % 2 === 0 ? -tiltAngle : tiltAngle;

  if (!isPaperFlutterEnabled) {
    return (
      <div data-paper-card="true" className={`transform-gpu wallpaper-card-target ${className}`} {...(props as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

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
            stiffness: Math.round(260 * effectiveSpeed),
            damping: 22,
            mass: 0.85,
          },
        },
      }}
      whileHover={{
        y: -3,
        rotateX: -2,
        transition: {
          type: "spring",
          stiffness: Math.round(400 * effectiveSpeed),
          damping: 25,
        },
      }}
      className={`transform-gpu ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};