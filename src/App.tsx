import React, { useState } from "react";
import { TitleBar, NavTab } from "./components/TitleBar";
import { 
  Gamepad2, 
  Flame, 
  History, 
  FolderDown, 
  Cpu, 
  Sliders, 
  Plus, 
  Search, 
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("launch");
  const [selectedGame, setSelectedGame] = useState<string>("wukong");

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl font-sans">
      {/* 顶部现代化无边框标题栏（PCL II 风格） */}
      <TitleBar
        title="PCL II  |  Fling Trainer"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 主体工作区：左侧白色栏 + 右侧灰白视区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧白色面板（按图示 1:1 骨架还原） */}
        <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 select-none shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
          {/* 搜索过滤框骨架 */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="搜索游戏或修改器..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all text-slate-700"
              />
            </div>
          </div>

          {/* 快捷分类与游戏列表骨架 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              最近游玩
            </div>

            <button
              onClick={() => setSelectedGame("wukong")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                selectedGame === "wukong"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="truncate flex-1">
                <div className="truncate">黑神话：悟空</div>
                <div className="text-[10px] text-slate-400">v1.0.9 · 36 项修改</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedGame("eldenring")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                selectedGame === "eldenring"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="w-7 h-7 rounded bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div className="truncate flex-1">
                <div className="truncate">艾尔登法环：黄金树幽影</div>
                <div className="text-[10px] text-slate-400">v1.14 · 42 项修改</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedGame("cyberpunk")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                selectedGame === "cyberpunk"
                  ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="w-7 h-7 rounded bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="truncate flex-1">
                <div className="truncate">赛博朋克 2077</div>
                <div className="text-[10px] text-slate-400">v2.13 · 38 项修改</div>
              </div>
            </button>

            <div className="pt-2 px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              快捷管理
            </div>

            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
              <History className="w-4 h-4 text-slate-400" />
              <span>历史启动记录</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
              <FolderDown className="w-4 h-4 text-slate-400" />
              <span>本地扫描目录</span>
            </button>
          </div>

          {/* 底部新增与状态 */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium">
              <Plus className="w-3.5 h-3.5" />
              <span>添加游戏/程序</span>
            </button>
            <span className="text-[11px] text-slate-400">共 3 个修改器</span>
          </div>
        </aside>

        {/* 右侧工作区视口（按图示灰白背景 1:1 骨架还原） */}
        <main className="flex-1 bg-[#edf0f5] p-6 overflow-y-auto">
          {/* 顶部标题区骨架 */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                  {selectedGame === "wukong"
                    ? "黑神话：悟空 (Black Myth: Wukong)"
                    : selectedGame === "eldenring"
                    ? "艾尔登法环 (ELDEN RING)"
                    : "赛博朋克 2077 (Cyberpunk 2077)"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="w-3 h-3" />
                  已就绪
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fling Trainer 官方最新兼容版本 · 支持 Steam / WeGame / Epic 平台
              </p>
            </div>

            {/* 一键启动修改器大按钮 */}
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95">
                <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>一键启动修改器</span>
              </button>
            </div>
          </div>

          {/* 预留后续 Aceternity UI 流光与 Bento Grid 卡片特效区域 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">进程监控</span>
                <Cpu className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-800">未检测到游戏</div>
              <p className="text-[11px] text-slate-400 mt-1">启动游戏后将自动捕获并注入</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">热键方案</span>
                <Sliders className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-800">标准小键盘</div>
              <p className="text-[11px] text-slate-400 mt-1">Num 1~9 无限生命 / 一击必杀等</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">更新渠道</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 text-2xl font-bold text-slate-800">已是最新版</div>
              <p className="text-[11px] text-slate-400 mt-1">同步自 flingtrainer.com 镜像</p>
            </div>
          </div>

          {/* 骨架大卡片占位区（待后续集成 Aceternity UI 流光与 Motion 动画） */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200/80 p-6 min-h-[280px] flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              功能面板与特效组件插槽已就绪
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              骨架已按 PCL II 风格 1:1 搭建完毕。前置依赖库已全部配置到位，后续可无缝接入 Aceternity UI 流光边框、动效卡片与 Motion 转场动画。
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
