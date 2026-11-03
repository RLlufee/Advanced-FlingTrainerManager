import React, { useState } from "react";
import { TitleBar, NavTab } from "./components/TitleBar";
import { DownloadView } from "./components/DownloadView";
import { LaunchView } from "./components/LaunchView";
import { SettingsView } from "./components/SettingsView";
import { MoreView } from "./components/MoreView";
import { AnimationProvider } from "./components/ui/motion";
import { ThemeProvider } from "./components/ui/theme";
import { WallpaperBackdrop } from "./components/WallpaperBackdrop";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("launch"); // 默认首发展示启动管理页（已安装修改器与一键启动）

  return (
    <ThemeProvider>
      <AnimationProvider>
        <div className="app-canvas relative h-screen w-screen flex flex-col overflow-hidden border border-slate-300 dark:border-slate-800 shadow-2xl font-sans transition-colors duration-300">
          <WallpaperBackdrop />
          {/* 顶部现代化无边框标题栏（PCL II 风格） */}
          <TitleBar
            title="PCL II  |  Fling Trainer"
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* 主体工作区（Tab 保活机制：切换页面不销毁组件，保持状态与滚动位置，0ms 瞬间切换） */}
          <div className="relative z-10 flex-1 flex overflow-hidden">
            <div
              className={`flex-1 flex overflow-hidden ${
                activeTab === "download" ? "flex" : "hidden"
              }`}
            >
              <DownloadView />
            </div>
            <div
              className={`flex-1 flex overflow-hidden ${
                activeTab === "launch" ? "flex" : "hidden"
              }`}
            >
              <LaunchView
                isActive={activeTab === "launch"}
                onNavigateToDownload={() => setActiveTab("download")}
              />
            </div>
            <div
              className={`flex-1 flex overflow-hidden ${
                activeTab === "settings" ? "flex" : "hidden"
              }`}
            >
              <SettingsView isActive={activeTab === "settings"} />
            </div>
            <div
              className={`flex-1 flex overflow-hidden ${
                activeTab === "more" ? "flex" : "hidden"
              }`}
            >
              <MoreView isActive={activeTab === "more"} />
            </div>
          </div>
        </div>
      </AnimationProvider>
    </ThemeProvider>
  );
};

export default App;
