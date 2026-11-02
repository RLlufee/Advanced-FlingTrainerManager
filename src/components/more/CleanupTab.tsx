import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
  FolderSync,
  AlertOctagon,
  DownloadCloud,
  Globe,
  Image,
  ShieldCheck,
} from "lucide-react";
import { cleanupApi, CleanupScanResult, CleanupRunResult } from "../../services/cleanupApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";

export const CleanupTab: React.FC = () => {
  const [scanResult, setScanResult] = useState<CleanupScanResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [runResult, setRunResult] = useState<CleanupRunResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setRunResult(null);
    try {
      const res = await cleanupApi.scan();
      setScanResult(res);
      // 默认全选有垃圾的分类
      const validIds = res.categories.filter((c) => c.bytes > 0).map((c) => c.id);
      setSelectedIds(validIds.length > 0 ? validIds : res.categories.map((c) => c.id));
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    handleScan();
  }, []);

  const handleToggleCategory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (!scanResult) return;
    if (selectAll) {
      setSelectedIds(scanResult.categories.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClean = async () => {
    if (selectedIds.length === 0 || isCleaning) return;
    setIsCleaning(true);
    setErrorMsg(null);
    try {
      const res = await cleanupApi.run(selectedIds);
      setRunResult(res);
      // 清理完毕后重新扫描刷新状态
      await handleScan();
    } catch (e) {
      setErrorMsg(String(e));
    } finally {
      setIsCleaning(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Gamepad2":
        return <Gamepad2 className="w-4 h-4 text-emerald-600" />;
      case "FolderSync":
        return <FolderSync className="w-4 h-4 text-cyan-600" />;
      case "AlertOctagon":
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case "DownloadCloud":
        return <DownloadCloud className="w-4 h-4 text-blue-600" />;
      case "Globe":
        return <Globe className="w-4 h-4 text-indigo-600" />;
      case "Image":
        return <Image className="w-4 h-4 text-purple-600" />;
      default:
        return <Trash2 className="w-4 h-4 text-slate-600" />;
    }
  };

  const selectedBytes = scanResult
    ? scanResult.categories
        .filter((c) => selectedIds.includes(c.id))
        .reduce((sum, c) => sum + c.bytes, 0)
    : 0;

  return (
    <PaperContainer className="space-y-5 select-none">
      {/* 顶部主横幅：扫描统计与一键清理 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <JellyIcon intensity="bouncy">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
          </JellyIcon>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900">
                系统与游戏深层垃圾清理
              </h2>
              {scanResult && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  发现 {formatBytes(scanResult.total_bytes)} 可清理空间
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>共计 {scanResult?.total_files || 0} 个缓存与碎片文件</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {scanResult?.is_admin ? "管理员权限就绪" : "标准用户模式"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <TypewriterTooltip text="全面重新扫描游戏着色器、DirectX 缓存及系统碎片" position="top">
            <button
              onClick={handleScan}
              disabled={isScanning || isCleaning}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            >
              <JellyIcon intensity="gentle">
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
              </JellyIcon>
            </button>
          </TypewriterTooltip>

          <TypewriterTooltip text="安全销毁选中的垃圾缓存文件，立即回收物理磁盘可用空间" position="top">
            <button
              onClick={handleClean}
              disabled={isCleaning || isScanning || selectedIds.length === 0 || selectedBytes === 0}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCleaning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在深度释放中...</span>
                </>
              ) : (
                <>
                  <JellyIcon intensity="bouncy">
                    <Trash2 className="w-4 h-4" />
                  </JellyIcon>
                  <span>立即释放 ({formatBytes(selectedBytes)})</span>
                </>
              )}
            </button>
          </TypewriterTooltip>
        </div>
      </PaperCard>

      {/* 清理成功反馈横幅 */}
      {runResult && (
        <PaperCard className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">🎉 清理大成功！</span> 已为您安全释放{" "}
              <strong className="font-bold text-emerald-700 font-mono">
                {formatBytes(runResult.freed_bytes)}
              </strong>{" "}
              磁盘空间，成功清除了 {runResult.cleaned_files} 个文件喵~
              {runResult.failed_count > 0 && (
                <span className="text-slate-400 ml-1">
                  (已自动跳过 {runResult.failed_count} 个当前正在被游戏或系统占用的文件)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setRunResult(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer shrink-0"
          >
            关闭
          </button>
        </PaperCard>
      )}

      {/* 报错反馈 */}
      {errorMsg && (
        <PaperCard className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </PaperCard>
      )}

      {/* 清理分类列表 */}
      <PaperCard className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800">可清理专项缓存清单</h3>
            <span className="text-[11px] text-slate-400">
              (已勾选 {selectedIds.length} 项)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => handleSelectAll(true)}
              className="text-cyan-600 hover:text-cyan-700 font-medium cursor-pointer"
            >
              全选
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => handleSelectAll(false)}
              className="text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              清空
            </button>
          </div>
        </div>

        {isScanning && !scanResult ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600" />
            <p>正在扫描 Direct-X 着色器及系统临时碎片...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scanResult?.categories.map((cat) => {
              const isChecked = selectedIds.includes(cat.id);
              const isEmpty = cat.bytes === 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => !isEmpty && handleToggleCategory(cat.id)}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isEmpty
                      ? "bg-slate-50/50 border-slate-200/60 opacity-60 cursor-default"
                      : isChecked
                      ? "bg-emerald-50/20 border-emerald-300/80 ring-1 ring-emerald-500/15 shadow-2xs"
                      : "bg-white border-slate-200/80 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isEmpty}
                    onChange={() => handleToggleCategory(cat.id)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <JellyIcon intensity="gentle">
                          {getCategoryIcon(cat.icon)}
                        </JellyIcon>
                        <span>{cat.name}</span>
                      </div>
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          isEmpty
                            ? "bg-slate-100 text-slate-400"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        }`}
                      >
                        {formatBytes(cat.bytes)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                      {cat.description}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      包含 {cat.file_count} 个文件
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PaperCard>
    </PaperContainer>
  );
};
