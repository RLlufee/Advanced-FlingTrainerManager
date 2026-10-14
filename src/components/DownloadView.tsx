import React, { useState, useEffect } from "react";
import {
  trainerApi,
  Trainer,
  DownloadProgressPayload,
  InstalledTrainerRecord,
} from "../services/trainerApi";
import {
  Search,
  RefreshCw,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const DownloadView: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [downloads, setDownloads] = useState<Record<string, DownloadProgressPayload>>({});
  const [installedMap, setInstalledMap] = useState<Record<string, InstalledTrainerRecord>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. 加载本地已安装列表
  const refreshInstalled = async () => {
    try {
      const records = await trainerApi.getInstalledTrainers();
      const map: Record<string, InstalledTrainerRecord> = {};
      for (const r of records) {
        map[r.id] = r;
      }
      setInstalledMap(map);
    } catch (e) {
      console.warn("读取已安装修改器记录失败", e);
    }
  };

  // 2. 加载官网列表
  const loadTrainers = async (targetPage = 1, query = "") => {
    try {
      setLoading(true);
      setErrorMsg(null);
      let result;
      if (query.trim()) {
        result = await trainerApi.searchTrainers(query.trim(), targetPage);
      } else {
        result = await trainerApi.fetchTrainers(targetPage);
      }
      setTrainers(result.trainers);
      setPage(targetPage);

      // 默认选中第一个
      if (result.trainers.length > 0 && !selectedTrainer) {
        handleSelectTrainer(result.trainers[0]);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(typeof e === "string" ? e : "从风灵月影官网获取修改器数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 3. 选中某个修改器，拉取完整详情（包含 options 功能热键清单和下载直链）
  const handleSelectTrainer = async (t: Trainer) => {
    setSelectedTrainer(t);
    try {
      setDetailLoading(true);
      const detail = await trainerApi.getTrainerDetail(t.id);
      const isBadThumb = !detail.thumbnail || detail.thumbnail.includes("gravatar") || detail.thumbnail.includes("avatar");
      setSelectedTrainer({
        ...detail,
        thumbnail: isBadThumb ? t.thumbnail : detail.thumbnail,
      });
    } catch (e) {
      console.warn("获取详情失败，使用基本信息", e);
    } finally {
      setDetailLoading(false);
    }
  };

  // 4. 触发下载
  const handleDownload = async (t: Trainer) => {
    try {
      setDownloads((prev) => ({
        ...prev,
        [t.id]: {
          trainer_id: t.id,
          progress: 1,
          downloaded_bytes: 0,
          total_bytes: null,
          speed_bytes_per_sec: 0,
          status: "downloading",
          error: null,
        },
      }));

      const record = await trainerApi.downloadTrainer(t);
      setInstalledMap((prev) => ({
        ...prev,
        [record.id]: record,
      }));
    } catch (e) {
      console.error("下载执行错误", e);
      setDownloads((prev) => ({
        ...prev,
        [t.id]: {
          trainer_id: t.id,
          progress: 0,
          downloaded_bytes: 0,
          total_bytes: null,
          speed_bytes_per_sec: 0,
          status: "error",
          error: String(e),
        },
      }));
    }
  };

  // 5. 启动修改器
  const handleLaunch = async (id: string) => {
    try {
      const res = await trainerApi.launchTrainer(id);
      alert(res);
    } catch (e) {
      alert("启动失败: " + e);
    }
  };

  useEffect(() => {
    refreshInstalled();
    loadTrainers(1);

    // 监听实时下载进度广播
    let unlisten: (() => void) | undefined;
    trainerApi.onDownloadProgress((payload) => {
      setDownloads((prev) => ({
        ...prev,
        [payload.trainer_id]: payload,
      }));
      if (payload.status === "completed") {
        refreshInstalled();
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) {
      return (bytesPerSec / (1024 * 1024)).toFixed(1) + " MB/s";
    }
    return (bytesPerSec / 1024).toFixed(0) + " KB/s";
  };

  const isCurrentInstalled = selectedTrainer && Boolean(installedMap[selectedTrainer.id]);
  const currentDownload = selectedTrainer ? downloads[selectedTrainer.id] : undefined;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f3f4f6]">
      {/* 顶部搜索与过滤条 */}
      <div className="h-14 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadTrainers(1, searchQuery)}
              placeholder="搜索风灵月影官网修改器（按 Enter 检索）..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-slate-800 transition-all"
            />
          </div>
          <button
            onClick={() => loadTrainers(1, searchQuery)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 active:scale-95"
          >
            搜索
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchQuery("");
              loadTrainers(1, "");
            }}
            title="刷新数据"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 主体工作区：左列表 + 右详情 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：修改器列表 */}
        <div className="w-[360px] border-r border-slate-200/80 bg-white flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{searchQuery ? `搜索结果: "${searchQuery}"` : "官网最新修改器"}</span>
            <span>共 {trainers.length} 个条目</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading && trainers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
                <span>正在从风灵月影官网同步数据...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-4 text-xs text-rose-600 bg-rose-50 rounded-lg m-2">
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  加载失败
                </div>
                {errorMsg}
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                未检索到匹配的修改器
              </div>
            ) : (
              trainers.map((t) => {
                const isSelected = selectedTrainer?.id === t.id;
                const isInst = Boolean(installedMap[t.id]);
                const dl = downloads[t.id];

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrainer(t)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      isSelected
                        ? "bg-cyan-50/60 border-cyan-300 shadow-sm"
                        : "bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    {/* 缩略图 */}
                    <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50">
                      {t.thumbnail ? (
                        <img
                          src={t.thumbnail}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Layers className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-slate-800 truncate" title={t.name}>
                          {t.name}
                        </h4>
                        {isInst && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                            已安装
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {t.version && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[120px]">
                            {t.version}
                          </span>
                        )}
                        {t.game_version && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {t.game_version}
                          </span>
                        )}
                      </div>

                      {/* 下载进度条预览 */}
                      {dl && dl.status === "downloading" && (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all duration-200"
                            style={{ width: `${dl.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 分页控制器 */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadTrainers(page - 1, searchQuery)}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>上一页</span>
            </button>
            <span className="font-medium text-slate-500">第 {page} 页</span>
            <button
              disabled={loading || trainers.length === 0}
              onClick={() => loadTrainers(page + 1, searchQuery)}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>下一页</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 右侧：修改器详情区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTrainer ? (
            <div className="max-w-3xl space-y-6">
              {/* 头部大卡片 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                <div className="flex gap-6 items-start">
                  <div className="w-28 h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                    {selectedTrainer.thumbnail ? (
                      <img
                        src={selectedTrainer.thumbnail}
                        alt={selectedTrainer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Sparkles className="w-10 h-10" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {selectedTrainer.name}
                      </h2>
                      {isCurrentInstalled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已就绪
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
                      {selectedTrainer.version && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md font-medium text-slate-700">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {selectedTrainer.version}
                        </span>
                      )}
                      {selectedTrainer.game_version && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md font-medium text-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          游戏版本: {selectedTrainer.game_version}
                        </span>
                      )}
                      {selectedTrainer.last_update && (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          更新于 {selectedTrainer.last_update}
                        </span>
                      )}
                    </div>

                    {/* 操作控制栏 */}
                    <div className="mt-5 flex items-center gap-3">
                      {isCurrentInstalled ? (
                        <button
                          onClick={() => handleLaunch(selectedTrainer.id)}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>立即启动修改器</span>
                        </button>
                      ) : currentDownload?.status === "downloading" ? (
                        <div className="flex-1 max-w-xs">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>正在极速下载... {currentDownload.progress.toFixed(0)}%</span>
                            <span>{formatSpeed(currentDownload.speed_bytes_per_sec)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full transition-all duration-200"
                              style={{ width: `${currentDownload.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : currentDownload?.status === "extracting" ? (
                        <div className="flex items-center gap-2 text-xs text-cyan-600 font-medium">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>正在自动解压并部署修改器组件...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDownload(selectedTrainer)}
                          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          <span>一键下载并安装</span>
                        </button>
                      )}

                      {isCurrentInstalled && (
                        <button
                          onClick={() => handleDownload(selectedTrainer)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-all cursor-pointer"
                        >
                          重新下载
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 修改功能选项清单 (Options / Cheats) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">修改器功能与热键清单</h3>
                    {selectedTrainer.options && selectedTrainer.options.length > 0 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                        {selectedTrainer.options.length} 项修改
                      </span>
                    )}
                  </div>
                  {detailLoading && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      正在提取官网功能明细...
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  {selectedTrainer.option_items && selectedTrainer.option_items.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {selectedTrainer.option_items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-100/70 hover:border-slate-300 transition-all gap-1.5"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-xs shrink-0 mt-1" />
                            <span className="text-xs text-slate-800 font-semibold font-mono tracking-tight break-words">
                              {item.title}
                            </span>
                          </div>
                          {item.note && (
                            <div className="pl-4 text-[11px] text-slate-500 bg-white/70 border border-slate-200/50 rounded-lg p-1.5 leading-relaxed font-sans">
                              <span className="font-medium text-cyan-700 mr-1">ℹ️ 生效说明:</span>
                              {item.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : selectedTrainer.options && selectedTrainer.options.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {selectedTrainer.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-xs shrink-0" />
                          <span className="text-xs text-slate-700 font-medium font-mono">
                            {opt}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedTrainer.description || "正在从风灵月影官网拉取完整说明..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-3">
              <Download className="w-10 h-10 text-slate-300" />
              <span>请在左侧选择一个修改器查看功能与下载</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadView;
