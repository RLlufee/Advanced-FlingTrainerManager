import React from "react";
import {
  HardDrive,
  RefreshCw,
  FolderOpen,
  ExternalLink,
  Archive,
  Layers,
  Info,
  Trash2,
  Database,
  Monitor,
} from "lucide-react";
import { ManagementSettings, StorageStats } from "../../services/configApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { FluidSlider } from "../ui/motion/FluidSlider";

interface ManagementTabProps {
  management: ManagementSettings;
  storageStats: StorageStats | null;
  isScanningStorage: boolean;
  isCleaningCache: boolean;
  onUpdateManagement: (partial: Partial<ManagementSettings>) => void;
  onLoadStorageStats: () => void;
  onPickNewDirectory: () => void;
  onOpenCurrentTrainersDir: () => void;
  onCleanCache: () => void;
  onToggleStartup: (enable: boolean) => void;
  formatBytes: (bytes: number) => string;
}

export const ManagementTab: React.FC<ManagementTabProps> = ({
  management,
  storageStats,
  isScanningStorage,
  isCleaningCache,
  onUpdateManagement,
  onLoadStorageStats,
  onPickNewDirectory,
  onOpenCurrentTrainersDir,
  onCleanCache,
  onToggleStartup,
  formatBytes,
}) => {
  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 卡片 1：📦 便携存储根目录与一键无损迁移 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <JellyIcon intensity="bouncy">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">
                <HardDrive className="w-5 h-5" />
              </div>
            </JellyIcon>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>修改器便携存储根目录</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full">
                  便携模式生效中
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                每个游戏拥有独立的专属子目录，内含 exe 修改器、结构化看板数据（trainer.json）与离线原画（cover.jpg）。支持自由变更盘符路径，并提供一键自动搬家无损迁移。
              </p>
            </div>
          </div>

          <TypewriterTooltip text="重新扫描并计算本地存储与海报缓存容量" position="left">
            <button
              type="button"
              onClick={onLoadStorageStats}
              disabled={isScanningStorage}
              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <JellyIcon intensity="gentle">
                <RefreshCw className={`w-4 h-4 ${isScanningStorage ? "animate-spin text-cyan-600" : ""}`} />
              </JellyIcon>
            </button>
          </TypewriterTooltip>
        </div>

        {/* 当前存储路径条 */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={storageStats?.trainers_dir || "正在读取路径..."}
              className="flex-1 font-mono text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 select-all focus:outline-none"
            />
            <TypewriterTooltip text="选取新盘符目录并开启无损搬家向导" position="top">
              <button
                type="button"
                onClick={onPickNewDirectory}
                className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <JellyIcon intensity="gentle">
                  <FolderOpen className="w-3.5 h-3.5" />
                </JellyIcon>
                <span>更改目录...</span>
              </button>
            </TypewriterTooltip>
            <TypewriterTooltip text="在系统资源管理器中打开此文件夹" position="top">
              <button
                type="button"
                onClick={onOpenCurrentTrainersDir}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 border border-slate-200/80 rounded-xl transition-all cursor-pointer"
              >
                <JellyIcon intensity="gentle">
                  <ExternalLink className="w-4 h-4 text-cyan-600" />
                </JellyIcon>
              </button>
            </TypewriterTooltip>
          </div>

          {/* 存储三项微型看板 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium">已纳管修改器</span>
              <p className="text-sm font-bold font-mono text-slate-800">
                {storageStats?.trainers_count ?? 0} <span className="text-xs font-normal text-slate-500">款游戏</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium">当前目录总占用</span>
              <p className="text-sm font-bold font-mono text-cyan-700">
                {formatBytes(storageStats?.total_size_bytes ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium">本地封面海报缓存</span>
              <p className="text-sm font-bold font-mono text-emerald-700">
                {storageStats?.cover_cache_count ?? 0} <span className="text-xs font-normal text-slate-500">张 ({formatBytes(storageStats?.cover_cache_size_bytes ?? 0)})</span>
              </p>
            </div>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 2：📥 外部导入与解压自动化规则 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
              <Archive className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              外部导入与解压自动化规则
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              在从外部文件夹批量扫描导入修改器，或从官网下载压缩包时所触发的解构、提取与净化规则。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3">
          {/* 开关：遇到 zip 自动解压 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                遇到 ZIP 压缩包时自动解压并提取 .exe 主程序
              </span>
              <p className="text-[11px] text-slate-400">
                自动剔除无关的说明文档或多余包装层，仅保留最核心的修改器可执行文件
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateManagement({
                  auto_extract_zip: !management.auto_extract_zip,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                management.auto_extract_zip ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  management.auto_extract_zip ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 扫描穿透深度滑块 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                扫描导入目录最大递归穿透深度
              </span>
              <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                {management.scan_depth} 层子目录
              </span>
            </div>
            <FluidSlider
              min={1}
              max={4}
              step={1}
              value={management.scan_depth}
              onChange={(val) => onUpdateManagement({ scan_depth: val })}
              formatValue={(val) => `${val} 层`}
              color="indigo"
              marks={[
                { value: 1, label: "1 层 (仅选定根目录)" },
                { value: 2, label: "2 层 (推荐标准)" },
                { value: 4, label: "4 层 (深度穿透)" },
              ]}
            />
          </div>

          {/* 黑名单内置说明 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>
              <strong>智能净化机制</strong>：系统已全自动排除 <code>unins000.exe</code>、<code>setup.exe</code>、<code>dxwebsetup.exe</code>、<code>vc_redist.exe</code> 以及 Unity 崩溃日志收集器等干扰项，确保已安装列表纯净整齐。
            </span>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 3：🧹 缓存清理与本地离线字典 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <Trash2 className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              缓存清理与本地离线词库
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              维护本地临时导入产生的碎片文件，并监控内置 SQLite 离线中英游戏翻译对照库的运行状态。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3">
          {/* 临时解压缓存清理 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                临时解压与扫描导入临时缓存
              </span>
              <p className="text-[11px] text-slate-400">
                定期清理系统临时目录中的解压碎片，不影响已成功建档的修改器文件
              </p>
            </div>
            <TypewriterTooltip text="释放临时解压留存的安装包残留碎片" position="left">
              <button
                type="button"
                onClick={onCleanCache}
                disabled={isCleaningCache}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <JellyIcon intensity="bouncy">
                  <Trash2 className={`w-3.5 h-3.5 text-amber-600 ${isCleaningCache ? "animate-spin" : ""}`} />
                </JellyIcon>
                <span>{isCleaningCache ? "正在清理..." : "一键清理临时缓存"}</span>
              </button>
            </TypewriterTooltip>
          </div>

          {/* 本地 SQLite 离线词库状态 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <JellyIcon intensity="gentle">
                <Database className="w-4 h-4 text-cyan-600" />
              </JellyIcon>
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  本地 SQLite 游戏名称离线映射库
                </span>
                <p className="text-[11px] text-slate-400">
                  断网时亦能秒级将中文游戏名反向映射为风灵月影官网标准 Slug
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                收录 {storageStats?.offline_dict_count ?? 1185}+ 款游戏
              </span>
            </div>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 4：🪟 窗口行为与开机启动 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
              <Monitor className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              窗口行为与开机自启
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              定义关闭客户端时的系统托盘驻留偏好，以及 Windows 登录自动加载。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3">
          {/* 开机自启 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Windows 登录时自动启动修改器管家
              </span>
              <p className="text-[11px] text-slate-400">
                开机静默常驻，玩游戏时随时快捷调出修改器
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleStartup(!management.launch_at_startup)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                management.launch_at_startup ? "bg-purple-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  management.launch_at_startup ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 关闭窗口最小化到托盘 */}
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                点击关闭按钮时最小化到系统托盘
              </span>
              <p className="text-[11px] text-slate-400">
                保持客户端后台驻留，避免误关后重新冷启动
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateManagement({
                  close_to_tray: !management.close_to_tray,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                management.close_to_tray ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  management.close_to_tray ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </PaperCard>
    </PaperContainer>
  );
};