import React, { useState } from "react";
import { TitleBar, NavTab } from "./components/TitleBar";
import { DownloadView } from "./components/DownloadView";
import { LaunchView } from "./components/LaunchView";
import { Settings } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("download"); // 默认展示装配好的下载页面

  return (
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
        {activeTab === "settings" && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-3 bg-[#edf0f5]">
            <Settings className="w-10 h-10 text-slate-300" />
            <span>设置与更多模块（正在构建中...）</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
