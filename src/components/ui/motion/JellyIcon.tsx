import React from "react";
import { motion, HTMLMotionProps, Variants } from "motion/react";

export interface JellyIconProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  intensity?: "gentle" | "medium" | "bouncy";
}

export const JellyIcon: React.FC<JellyIconProps> = ({
  children,
  className = "",
  intensity = "medium",
  ...props
}) => {
  const getVariants = (): Variants => {
    switch (intensity) {
      case "gentle":
        return {
          hover: {
            scale: 1.14,
            rotate: [0, -3, 3, 0],
            transition: { type: "spring", stiffness: 400, damping: 15 },
          },
          tap: { scale: 0.92 },
        };
      case "bouncy":
        return {
          hover: {
            scale: [1, 1.28, 0.9, 1.15, 1],
            rotate: [0, -8, 7, -3, 0],
            transition: { duration: 0.45, ease: "easeInOut" },
          },
          tap: { scale: 0.8, rotate: -5 },
        };
      case "medium":
      default:
        return {
          hover: {
            scale: [1, 1.2, 0.95, 1.08, 1],
            rotate: [0, -5, 4, -1, 0],
            transition: { duration: 0.4, ease: "easeInOut" },
          },
          tap: { scale: 0.86, rotate: 0 },
        };
    }
  };

  const variants = getVariants();

  return (
    <motion.div
      whileHover="hover"
      whileTap="tap"
      variants={variants}
      className={`inline-flex items-center justify-center cursor-pointer select-none origin-center ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
