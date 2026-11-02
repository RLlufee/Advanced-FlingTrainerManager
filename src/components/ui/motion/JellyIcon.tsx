import React from "react";
import { motion, HTMLMotionProps, Variants } from "motion/react";
import { useAnimationConfig } from "./AnimationContext";

export interface JellyIconProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  intensity?: "gentle" | "medium" | "bouncy" | "off";
}

export const JellyIcon: React.FC<JellyIconProps> = ({
  children,
  className = "",
  intensity,
  ...props
}) => {
  const { jellyIntensity: globalIntensity, effectiveSpeed } = useAnimationConfig();
  const currentIntensity = intensity ?? globalIntensity;

  if (currentIntensity === "off" || globalIntensity === "off") {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        {children}
      </div>
    );
  }

  const durationScale = 1 / effectiveSpeed;

  const getVariants = (): Variants => {
    switch (currentIntensity) {
      case "gentle":
        return {
          hover: {
            scale: 1.14,
            rotate: [0, -3, 3, 0],
            transition: {
              type: "spring",
              stiffness: Math.round(400 * effectiveSpeed),
              damping: 15,
            },
          },
          tap: { scale: 0.94 },
        };
      case "bouncy":
        return {
          hover: {
            scale: [1, 1.28, 0.9, 1.15, 1],
            rotate: [0, -8, 7, -3, 0],
            transition: {
              duration: 0.45 * durationScale,
              ease: "easeInOut",
            },
          },
          tap: { scale: 0.8, rotate: -5 },
        };
      case "medium":
      default:
        return {
          hover: {
            scale: [1, 1.2, 0.95, 1.08, 1],
            rotate: [0, -5, 4, -1, 0],
            transition: {
              duration: 0.4 * durationScale,
              ease: "easeInOut",
            },
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