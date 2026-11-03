import React, { useState, useEffect, useRef } from "react";
import {
  trainerApi,
  Trainer,
  DownloadProgressPayload,
  InstalledTrainerRecord,
} from "../../services/trainerApi";
import { DownloadHeader } from "./DownloadHeader";
import { DownloadSidebar } from "./DownloadSidebar";
import { TrainerDetailView } from "./TrainerDetailView";

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

  // 内存级秒开详情缓存与异步请求防竞态序列
  const detailCache = useRef<Map<string, Trainer>>(new Map());
  const selectRequestIdRef = useRef<number>(0);

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
  const loadTrainers = async (targetPage = 1, query = "", forceRefresh = false) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      let result;
      if (query.trim()) {
        result = await trainerApi.searchTrainers(query.trim(), targetPage);
      } else {
        result = await trainerApi.fetchTrainers(targetPage, forceRefresh);
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

  // 3. 选中某个修改器，拉取完整详情（带请求序列号防御异步竞态 P1-03）
  const handleSelectTrainer = async (t: Trainer, forceRefresh: boolean = false) => {
    const reqId = ++selectRequestIdRef.current;

    if (!forceRefresh && detailCache.current.has(t.id)) {
      const cached = detailCache.current.get(t.id)!;
      if ((cached.option_items && cached.option_items.length > 0) || cached.download_url) {
        setSelectedTrainer(cached);
        return;
      }
    }

    setSelectedTrainer(t);
    try {
      setDetailLoading(true);
      const detail = await trainerApi.getTrainerDetail(t.id, forceRefresh);

      // 若当前用户已选中其他项，丢弃较慢的陈旧响应
      if (selectRequestIdRef.current !== reqId) return;

      const isBadThumb =
        !detail.thumbnail ||
        detail.thumbnail.includes("gravatar") ||
        detail.thumbnail.includes("avatar");
      const enriched: Trainer = {
        ...detail,
        thumbnail: isBadThumb ? t.thumbnail : detail.thumbnail,
      };
      detailCache.current.set(t.id, enriched);
      setSelectedTrainer(enriched);
    } catch (e) {
      if (selectRequestIdRef.current === reqId) {
        console.warn("获取详情失败，使用基本信息", e);
      }
    } finally {
      if (selectRequestIdRef.current === reqId) {
        setDetailLoading(false);
      }
    }
  };

  // 4. 触发下载
  const handleDownload = async (t: Trainer) => {
    const targetTrainer =
      selectedTrainer && selectedTrainer.id === t.id && selectedTrainer.download_url
        ? selectedTrainer
        : detailCache.current.get(t.id) || t;

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

      const record = await trainerApi.downloadTrainer(targetTrainer);

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
    trainerApi
      .onDownloadProgress((payload) => {
        setDownloads((prev) => ({
          ...prev,
          [payload.trainer_id]: payload,
        }));
        if (payload.status === "completed") {
          refreshInstalled();
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const isCurrentInstalled = selectedTrainer ? Boolean(installedMap[selectedTrainer.id]) : false;
  const currentDownload = selectedTrainer ? downloads[selectedTrainer.id] : undefined;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden transition-colors duration-300">
      {/* 顶部搜索与过滤条 */}
      <DownloadHeader
        searchQuery={searchQuery}
        loading={loading}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => loadTrainers(1, searchQuery)}
        onRefresh={() => {
          setSearchQuery("");
          loadTrainers(1, "", true);
        }}
      />

      {/* 主体工作区：左列表 + 右详情 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：修改器列表 */}
        <DownloadSidebar
          trainers={trainers}
          loading={loading}
          errorMsg={errorMsg}
          searchQuery={searchQuery}
          selectedId={selectedTrainer?.id}
          installedMap={installedMap}
          downloads={downloads}
          page={page}
          onSelectTrainer={handleSelectTrainer}
          onPageChange={(newPage) => loadTrainers(newPage, searchQuery)}
        />

        {/* 右侧：修改器详情区 */}
        <div className="wallpaper-shell wallpaper-shell-content flex-1 overflow-y-auto p-6">
          <TrainerDetailView
            selectedTrainer={selectedTrainer}
            isInstalled={isCurrentInstalled}
            currentDownload={currentDownload}
            detailLoading={detailLoading}
            onSelectTrainer={handleSelectTrainer}
            onDownload={handleDownload}
            onLaunch={handleLaunch}
          />
        </div>
      </div>
    </div>
  );
};

export default DownloadView;
