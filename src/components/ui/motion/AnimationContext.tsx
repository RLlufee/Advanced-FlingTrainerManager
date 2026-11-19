import React, { createContext, useContext, useState, useEffect } from "react";
import {
  configApi,
  AnimationSettings,
  JellyIntensity,
  FPS_TIERS,
  fpsNeedsUnlock,
  FrameRateStatus,
} from "../../../services/configApi";
import { setFrameRateLimit } from "../../../lib/frameRateLimiter";

export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  enabled: true,
  speed_multiplier: 1.0,
  jelly_intensity: "medium",
  paper_flutter: true,
  magnetic_tabs: true,
  typewriter_speed: 18,
  tab_transition_duration: 180,
  // 实际默认值由后端按显示器刷新率决定（不超过刷新率的最高档位），这里只是加载前的占位
  target_fps: 60,
};

export interface AnimationContextValue {
  settings: AnimationSettings;
  updateSettings: (partial: Partial<AnimationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  // 衍生的便捷判定状态
  isAnimEnabled: boolean;
  effectiveSpeed: number;
  jellyIntensity: JellyIntensity;
  isPaperFlutterEnabled: boolean;
  isMagneticEnabled: boolean;
  effectiveTypewriterSpeed: number;
  effectiveTabTransitionDuration: number;
  targetFps: number;
  cycleTargetFps: () => Promise<void>;
  /** 显示器刷新率（Hz），未知为 null */
  refreshRate: number | null;
  /** 当前档位与本次启动的垂直同步模式不一致，需要重启才能完全生效 */
  fpsNeedsRestart: boolean;
  restartApp: () => Promise<void>;
}

const AnimationContext = createContext<AnimationContextValue>({
  settings: DEFAULT_ANIMATION_SETTINGS,
  updateSettings: async () => {},
  resetSettings: async () => {},
  isAnimEnabled: true,
  effectiveSpeed: 1.0,
  jellyIntensity: "medium",
  isPaperFlutterEnabled: true,
  isMagneticEnabled: true,
  effectiveTypewriterSpeed: 18,
  effectiveTabTransitionDuration: 0.18,
  targetFps: 60,
  cycleTargetFps: async () => {},
  refreshRate: null,
  fpsNeedsRestart: false,
  restartApp: async () => {},
});

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_ANIMATION_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frameRateStatus, setFrameRateStatus] = useState<FrameRateStatus | null>(null);

  // 初始化加载配置
  useEffect(() => {
    let isMounted = true;
    configApi
      .getConfig()
      .then((cfg) => {
        if (isMounted && cfg.animation) {
          setSettings({
            ...DEFAULT_ANIMATION_SETTINGS,
            ...cfg.animation,
          });
        }
      })
      .catch((e) => {
        console.warn("读取动效配置失败，回退至默认设置:", e);
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });
    configApi
      .getFrameRateStatus()
      .then((status) => {
        if (isMounted) setFrameRateStatus(status);
      })
      .catch((e) => {
        console.warn("读取显示器刷新率失败:", e);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = async (partial: Partial<AnimationSettings>) => {
    const nextSettings: AnimationSettings = { ...settings, ...partial };
    setSettings(nextSettings);
    try {
      const cfg = await configApi.getConfig();
      await configApi.saveConfig({
        ...cfg,
        animation: nextSettings,
      });
    } catch (e) {
      console.error("保存动效配置失败:", e);
    }
  };

  const resetSettings = async () => {
    await updateSettings({
      ...DEFAULT_ANIMATION_SETTINGS,
      target_fps: frameRateStatus?.auto_target_fps ?? DEFAULT_ANIMATION_SETTINGS.target_fps,
    });
  };

  // 判定是否真正启用动效 (当 enabled 为 false 或倍率 >= 30 视为即时完成/无动画)
  const isInstant = !settings.enabled || settings.speed_multiplier >= 30 || settings.speed_multiplier <= 0;
  const isAnimEnabled = !isInstant;
  const effectiveSpeed = isInstant ? 200 : Math.max(0.2, Math.min(settings.speed_multiplier, 5.0));

  const jellyIntensity: JellyIntensity = !isAnimEnabled || settings.jelly_intensity === "off" ? "off" : settings.jelly_intensity;
  const isPaperFlutterEnabled = isAnimEnabled && settings.paper_flutter;
  const isMagneticEnabled = isAnimEnabled && settings.magnetic_tabs;
  const effectiveTypewriterSpeed = isAnimEnabled ? settings.typewriter_speed : 0;
  const rawTabDuration = settings.tab_transition_duration ?? 180;
  const effectiveTabTransitionDuration =
    !isAnimEnabled || rawTabDuration <= 0
      ? 0
      : (rawTabDuration / 1000) / effectiveSpeed;

  const targetFps = settings.target_fps ?? frameRateStatus?.auto_target_fps ?? 60;
  const refreshRate = frameRateStatus?.refresh_rate ?? null;
  const fpsNeedsRestart =
    frameRateStatus !== null &&
    fpsNeedsUnlock(targetFps, refreshRate) !== frameRateStatus.unlocked_at_startup;

  // 运行层帧率上限：配置加载完成后才下发，避免占位值短暂生效
  useEffect(() => {
    if (isLoaded) setFrameRateLimit(targetFps);
  }, [isLoaded, targetFps]);

  const cycleTargetFps = async () => {
    // 30 ➔ 60 ➔ 120 ➔ 165 ➔ 240 ➔ 无上限
    const currentIndex = FPS_TIERS.indexOf(targetFps as (typeof FPS_TIERS)[number]);
    const nextFps = FPS_TIERS[(currentIndex + 1) % FPS_TIERS.length];
    await updateSettings({ target_fps: nextFps });
  };

  const restartApp = async () => {
    await configApi.restartApp();
  };

  return (
    <AnimationContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isAnimEnabled,
        effectiveSpeed,
        jellyIntensity,
        isPaperFlutterEnabled,
        isMagneticEnabled,
        effectiveTypewriterSpeed,
        effectiveTabTransitionDuration,
        targetFps,
        cycleTargetFps,
        refreshRate,
        fpsNeedsRestart,
        restartApp,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationConfig = () => useContext(AnimationContext);