import React, { useState, useEffect } from "react";
import {
  Monitor,
  Cpu,
  Layers,
  HardDrive,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { hardwareApi, HardwareOverview } from "../../services/hardwareApi";
import { PaperContainer, PaperCard, JellyIcon, TypewriterTooltip } from "../ui/motion";

export const HardwareTab: React.FC = () => {
  const [hardware, setHardware] = useState<HardwareOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await hardwareApi.getHardwareOverview();
      setHardware(data);
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatUptime = (bootAt: number | null): string => {
    if (!bootAt || bootAt <= 0) return "未知";
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - bootAt) / 1000));
    const days = Math.floor(elapsedSeconds / 86400);
    const hours = Math.floor((elapsedSeconds % 86400) / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    if (days > 0) {
      return `${days} 天 ${hours} 小时 ${minutes} 分钟`;
    }
    return `${hours} 小时 ${minutes} 分钟`;
  };

  const handleCopySpecSheet = async () => {
    if (!hardware) return;

    const usedRam = hardware.ram_total - hardware.ram_free;
    const ramUsagePercent = hardware.ram_total > 0
      ? Math.round((usedRam / hardware.ram_total) * 100)
      : 0;

    const gpuList = hardware.gpus.length > 0
      ? hardware.gpus.map((g) => `${g.name} (驱动: ${g.driver_version || "系统原生"})`).join(" / ")
      : "集成显卡 / 未知";

    const diskSummary = hardware.volumes
      .map((v) => `${v.id} (余 ${formatBytes(v.free_bytes)} / 共 ${formatBytes(v.size_bytes)})`)
      .join(" · ");

    const text = [
      `🎮 【电脑硬件与游戏运行配置规格单】`,
      `• 设备型号: ${hardware.manufacturer} ${hardware.model}`,
      `• 操作系统: ${hardware.os} (Build ${hardware.build})`,
      `• 处理器 (CPU): ${hardware.cpu} (${hardware.cores} 核 ${hardware.threads} 线程)`,
      `• 物理内存 (RAM): ${formatBytes(hardware.ram_total)} (可用 ${formatBytes(hardware.ram_free)}, 占用率 ${ramUsagePercent}%)`,
      `• 显卡 (GPU): ${gpuList}`,
      `• 主板与固件: ${hardware.mainboard} (BIOS: ${hardware.bios})`,
      `• 磁盘分区: ${diskSummary}`,
      `• 连续运行时间: ${formatUptime(hardware.boot_at)}`,
      `• 生成来源: PCL II | Fling Trainer Manager`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      alert("复制到剪贴板失败");
    }
  };

  if (loading && !hardware) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-xs gap-3 select-none">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
        <span>正在读取 Windows 硬件配置全景看板喵...</span>
      </div>
    );
  }

  if (errorMsg && !hardware) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-3">
        <div className="text-sm font-bold text-rose-600">硬件信息采集失败</div>
        <div className="text-xs text-slate-500">{errorMsg}</div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
        >
          重试
        </button>
      </div>
    );
  }

  if (!hardware) return null;

  const usedRam = hardware.ram_total - hardware.ram_free;
  const ramUsagePercent = hardware.ram_total > 0
    ? Math.min(100, Math.max(0, Math.round((usedRam / hardware.ram_total) * 100)))
    : 0;

  return (
    <PaperContainer className="space-y-5 select-none" staggerDelay={0.07}>
      {/* 顶部主横幅：设备标识 + 规格单导出工具 */}
      <PaperCard delayIndex={0}>
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <JellyIcon intensity="bouncy">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
                <Monitor className="w-6 h-6" />
              </div>
            </JellyIcon>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900">
                  {hardware.manufacturer} {hardware.model}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80">
                  {hardware.os} (Build {hardware.build})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>开机连续运行: {formatUptime(hardware.boot_at)}</span>
                <span>·</span>
                <span>BIOS 版本: {hardware.bios}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <TypewriterTooltip content="重新读取全系统硬件配置数据" position="bottom">
              <JellyIcon intensity="medium">
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </JellyIcon>
            </TypewriterTooltip>

            <TypewriterTooltip content="复制标准化 Markdown 格式配置清单，方便求助和交流喵~" position="bottom">
              <button
                onClick={handleCopySpecSheet}
                className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "配置单已复制！" : "复制电脑配置清单"}</span>
              </button>
            </TypewriterTooltip>
          </div>
        </div>
      </PaperCard>

      {/* 4 大核心硬件卡片矩阵 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 处理器 CPU */}
        <PaperCard delayIndex={1}>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <JellyIcon intensity="gentle">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                </JellyIcon>
                <span className="text-xs font-bold text-slate-800">处理器 (CPU)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {hardware.cores} 物理核 · {hardware.threads} 线程
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 leading-snug">
                {hardware.cpu}
              </div>
              <div className="text-xs text-slate-400">
                单核睿频调度与超线程就绪 · 完美适配大型 3D 游戏指令集
              </div>
            </div>
          </div>
        </PaperCard>

        {/* 2. 显卡与驱动 GPU */}
        <PaperCard delayIndex={2}>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <JellyIcon intensity="gentle">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                </JellyIcon>
                <span className="text-xs font-bold text-slate-800">显示适配器 (GPU)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                共 {hardware.gpus.length} 款显卡
              </span>
            </div>
            <div className="space-y-2">
              {hardware.gpus.map((gpu, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate mr-2" title={gpu.name}>
                    {gpu.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                    驱动: {gpu.driver_version || "标准"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PaperCard>

        {/* 3. 物理内存 RAM */}
        <PaperCard delayIndex={3}>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <JellyIcon intensity="gentle">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </JellyIcon>
                <span className="text-xs font-bold text-slate-800">物理内存总览 (RAM)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                占用率: {ramUsagePercent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>已占用 {formatBytes(usedRam)}</span>
                <span>总容量 {formatBytes(hardware.ram_total)} (空闲 {formatBytes(hardware.ram_free)})</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${ramUsagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </PaperCard>

        {/* 4. 主板与固件 */}
        <PaperCard delayIndex={4}>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <JellyIcon intensity="gentle">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </JellyIcon>
                <span className="text-xs font-bold text-slate-800">主板与固件系统</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">
                UEFI 原生
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 leading-snug">
                {hardware.mainboard || "OEM 专属主板"}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>BIOS 版本: {hardware.bios}</span>
              </div>
            </div>
          </div>
        </PaperCard>
      </div>

      {/* 磁盘驱动器分区看板 */}
      <PaperCard delayIndex={5}>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <JellyIcon intensity="medium">
                <HardDrive className="w-4 h-4 text-cyan-600" />
              </JellyIcon>
              <h3 className="text-xs font-bold text-slate-800">磁盘存储驱动器与游戏安装盘</h3>
            </div>
            <span className="text-xs text-slate-400">
              共 {hardware.volumes.length} 个可用本地磁盘卷
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hardware.volumes.map((vol) => {
              const usedBytes = vol.size_bytes - vol.free_bytes;
              const percent = vol.size_bytes > 0
                ? Math.min(100, Math.max(0, Math.round((usedBytes / vol.size_bytes) * 100)))
                : 0;

              const isLowSpace = vol.free_bytes < 15 * 1024 * 1024 * 1024;

              return (
                <div
                  key={vol.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 font-mono">
                      本地磁盘 ({vol.id})
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                        isLowSpace
                          ? "bg-rose-100 text-rose-700 font-bold"
                          : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {isLowSpace ? "空间紧张" : `已用 ${percent}%`}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLowSpace ? "bg-rose-500" : percent > 85 ? "bg-amber-500" : "bg-cyan-600"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>剩余 {formatBytes(vol.free_bytes)}</span>
                    <span>总计 {formatBytes(vol.size_bytes)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PaperCard>
    </PaperContainer>
  );
};
