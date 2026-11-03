import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TitleBar, NavTab } from "./components/TitleBar";
import { DownloadView } from "./components/DownloadView";
import { LaunchView } from "./components/LaunchView";
import { SettingsView } from "./components/SettingsView";
import { MoreView } from "./components/MoreView";
import { AnimationProvider, useAnimationConfig } from "./components/ui/motion";
import { ThemeProvider } from "./components/ui/theme";
import { WallpaperBackdrop } from "./components/WallpaperBackdrop";

const MainWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("launch"); // 默认首发展示启动管理页
  const { effectiveTabTransitionDuration } = useAnimationConfig();

  return (
    <div className="app-canvas relative h-screen w-screen flex flex-col overflow-hidden border border-slate-300 dark:border-slate-800 shadow-2xl font-sans transition-colors duration-300">
      <WallpaperBackdrop />
      {/* 顶部现代化无边框标题栏（PCL II 风格） */}
      <TitleBar
        title="PCL II  |  Fling Trainer"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 主体工作区（支持跨页面丝滑过渡与纸片飘落入场） */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8, scale: 0.996 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.996 }}
            transition={{
              duration: effectiveTabTransitionDuration,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex-1 flex overflow-hidden w-full h-full"
          >
            {activeTab === "launch" && (
              <LaunchView
                isActive={true}
                onNavigateToDownload={() => setActiveTab("download")}
              />
            )}
            {activeTab === "download" && <DownloadView />}
            {activeTab === "settings" && <SettingsView isActive={true} />}
            {activeTab === "more" && <MoreView isActive={true} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AnimationProvider>
        <MainWorkspace />
      </AnimationProvider>
    </ThemeProvider>
  );
};

export default App;
