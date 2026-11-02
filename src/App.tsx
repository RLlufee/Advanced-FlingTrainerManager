import React, { useState } from "react";
import { TitleBar, NavTab } from "./components/TitleBar";
import { DownloadView } from "./components/DownloadView";
import { LaunchView } from "./components/LaunchView";
import { SettingsView } from "./components/SettingsView";
import { MoreView } from "./components/MoreView";
import { AnimationProvider } from "./components/ui/motion";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("download"); // 默认展示装配好的下载页面

  return (
    <AnimationProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl font-sans">
        {/* 顶部现代化无边框标题栏（PCL II 风格） */}
        <TitleBar
          title="PCL II  |  Fling Trainer"
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* 主体工作区（Tab 保活机制：切换页面不销毁组件，保持状态与滚动位置，0ms 瞬间切换） */}
        <div className="flex-1 flex overflow-hidden relative">
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
  );
};

export default App;