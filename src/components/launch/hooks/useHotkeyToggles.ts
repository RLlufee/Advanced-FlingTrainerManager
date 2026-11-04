import { useState, useEffect, useMemo, useCallback } from "react";
import {
  trainerApi,
  InstalledTrainerRecord,
  TrainerOptionItem,
} from "../../../services/trainerApi";
import {
  matchHotkey,
  translateHotkeyTitle,
  formatAllHotkeys,
  extractHotkey,
  isToggleableOption,
} from "../../../lib/hotkeyTranslate";

interface UseHotkeyTogglesProps {
  selectedTrainer: InstalledTrainerRecord | null;
  setTrainers: (
    updater: InstalledTrainerRecord[] | ((prev: InstalledTrainerRecord[]) => InstalledTrainerRecord[])
  ) => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export function useHotkeyToggles({
  selectedTrainer,
  setTrainers,
  showToast,
}: UseHotkeyTogglesProps) {
  const [hotkeyQuery, setHotkeyQuery] = useState<string>("");
  const [currentToggles, setCurrentToggles] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedKeyIdx, setCopiedKeyIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // 当选中的修改器切换时，同步加载其 saved_toggles
  useEffect(() => {
    if (selectedTrainer) {
      setCurrentToggles(selectedTrainer.saved_toggles || {});
    } else {
      setCurrentToggles({});
    }
  }, [selectedTrainer?.id]);

  // 当前选中修改器的热键项规范化
  const activeOptionItems = useMemo<TrainerOptionItem[]>(() => {
    if (!selectedTrainer) return [];
    if (
      selectedTrainer.option_items &&
      Array.isArray(selectedTrainer.option_items) &&
      selectedTrainer.option_items.length > 0
    ) {
      return selectedTrainer.option_items.filter(Boolean).map((item) => {
        if (typeof item === "string") {
          return { title: item, note: null };
        }
        return {
          title: item.title || "",
          note: item.note || null,
        };
      });
    }
    if (
      selectedTrainer.options &&
      Array.isArray(selectedTrainer.options) &&
      selectedTrainer.options.length > 0
    ) {
      return selectedTrainer.options.filter(Boolean).map((title) => ({
        title: typeof title === "string" ? title : String(title),
        note: null,
      }));
    }
    return [];
  }, [selectedTrainer]);

  // 过滤后的热键看板列表
  const filteredHotkeys = useMemo(() => {
    if (!hotkeyQuery.trim()) return activeOptionItems;
    return activeOptionItems.filter((item) =>
      matchHotkey(item.title, item.note, hotkeyQuery)
    );
  }, [activeOptionItems, hotkeyQuery]);

  // 统计当前已开启的开关数量
  const enabledTogglesCount = useMemo(() => {
    return Object.values(currentToggles).filter(Boolean).length;
  }, [currentToggles]);

  // 单项开关切换
  const handleToggleOption = useCallback(
    async (title: string) => {
      if (!selectedTrainer) return;
      const nextVal = !currentToggles[title];
      const newToggles = {
        ...currentToggles,
        [title]: nextVal,
      };
      setCurrentToggles(newToggles);

      try {
        await trainerApi.saveTrainerToggles(selectedTrainer.id, newToggles);
        setTrainers((prev) =>
          prev.map((t) =>
            t.id === selectedTrainer.id ? { ...t, saved_toggles: newToggles } : t
          )
        );
      } catch (e) {
        showToast("error", `保存开关状态失败: ${e}`);
      }
    },
    [currentToggles, selectedTrainer, setTrainers, showToast]
  );

  // 全开 / 清空开关预设
  const handleToggleAll = useCallback(
    async (enableAll: boolean) => {
      if (!selectedTrainer) return;
      const newToggles: Record<string, boolean> = {};
      if (enableAll) {
        activeOptionItems.forEach((item) => {
          if (isToggleableOption(item.title, item.note)) {
            newToggles[item.title] = true;
          }
        });
      }
      setCurrentToggles(newToggles);

      try {
        await trainerApi.saveTrainerToggles(selectedTrainer.id, newToggles);
        setTrainers((prev) =>
          prev.map((t) =>
            t.id === selectedTrainer.id ? { ...t, saved_toggles: newToggles } : t
          )
        );
        showToast(
          "info",
          enableAll
            ? "已将所有二元开关项设为开启预设喵~"
            : "已清空当前修改器的全部开启预设"
        );
      } catch (e) {
        showToast("error", `批量更新预设失败: ${e}`);
      }
    },
    [activeOptionItems, selectedTrainer, setTrainers, showToast]
  );

  // 一键同步预设热键模拟 (自动模拟键盘按键)
  const handleSyncHotkeys = useCallback(async () => {
    if (!selectedTrainer || isSyncing) return;
    const enabledTitles = Object.keys(currentToggles).filter(
      (title) => currentToggles[title]
    );

    if (enabledTitles.length === 0) {
      showToast(
        "info",
        "笨蛋主人，你还没打开任何功能的开关呢喵！先在下方开启几个想要的功能吧~"
      );
      return;
    }

    setIsSyncing(true);
    try {
      const hotkeysToSend = enabledTitles.map((t) => extractHotkey(t));
      const count = await trainerApi.syncTrainerHotkeys(
        selectedTrainer.id,
        hotkeysToSend
      );
      showToast(
        "success",
        `⚡ 模拟按键完成！已成功为您同步激活 ${count} 项预设功能喵~`
      );
    } catch (e) {
      showToast("error", `模拟热键同步失败: ${e}`);
    } finally {
      setIsSyncing(false);
    }
  }, [currentToggles, isSyncing, selectedTrainer, showToast]);

  // 单项复制热键
  const handleCopySingle = useCallback(
    async (title: string, note: string | null, index: number) => {
      const cn = translateHotkeyTitle(title);
      const text = cn
        ? `${title} [${cn}]${note ? ` (${note})` : ""}`
        : `${title}${note ? ` (${note})` : ""}`;
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKeyIdx(index);
        setTimeout(() => setCopiedKeyIdx(null), 1800);
      } catch {
        showToast("error", "写入系统剪贴板失败");
      }
    },
    [showToast]
  );

  // 一键复制全部热键
  const handleCopyAll = useCallback(async () => {
    if (activeOptionItems.length === 0) return;
    try {
      const text = formatAllHotkeys(activeOptionItems);
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      showToast("success", `已复制全部 ${activeOptionItems.length} 项热键说明！`);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showToast("error", "写入剪贴板失败");
    }
  }, [activeOptionItems, showToast]);

  return {
    hotkeyQuery,
    setHotkeyQuery,
    activeOptionItems,
    filteredHotkeys,
    currentToggles,
    enabledTogglesCount,
    isSyncing,
    copiedKeyIdx,
    copiedAll,
    handleToggleOption,
    handleToggleAll,
    handleSyncHotkeys,
    handleCopySingle,
    handleCopyAll,
  };
}
