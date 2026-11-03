import React, { createContext, useContext, useState, useEffect } from "react";
import { configApi, AnimationSettings, JellyIntensity } from "../../../services/configApi";

export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  enabled: true,
  speed_multiplier: 1.0,
  jelly_intensity: "medium",
  paper_flutter: true,
  magnetic_tabs: true,
  typewriter_speed: 18,
  tab_transition_duration: 180,
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
});

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AnimationSettings>(DEFAULT_ANIMATION_SETTINGS);

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
    await updateSettings(DEFAULT_ANIMATION_SETTINGS);
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
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimationConfig = () => useContext(AnimationContext);