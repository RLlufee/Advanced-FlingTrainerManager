import React from "react";
import {
  ShieldCheck,
  Sliders,
  Clock,
  Flame,
  Info,
  Play,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";
import { HotkeySettings } from "../../services/configApi";
import { PaperContainer, PaperCard } from "../ui/motion/PaperFlutter";
import { JellyIcon } from "../ui/motion/JellyIcon";
import { TypewriterTooltip } from "../ui/motion/TypewriterTooltip";
import { FluidSlider } from "../ui/motion/FluidSlider";

interface HotkeyTabProps {
  hotkey: HotkeySettings;
  onUpdateHotkey: (partial: Partial<HotkeySettings>) => void;
  onExportPresets: () => void;
  onOpenImportModal: () => void;
  onOpenClearConfirm: () => void;
}

export const HotkeyTab: React.FC<HotkeyTabProps> = ({
  hotkey,
  onUpdateHotkey,
  onExportPresets,
  onOpenImportModal,
  onOpenClearConfirm,
}) => {
  return (
    <PaperContainer className="max-w-4xl mx-auto space-y-4">
      {/* 卡片 1：🛡️ 管理员提权策略 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <JellyIcon intensity="bouncy">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </JellyIcon>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                以管理员身份提权启动修改器（建议开启⚠️）
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                单机大作（如《艾尔登法环》、《赛博朋克2077》）常运行在高完整性权限下。开启后启动修改器将触发 Windows UAC 提权授权，确保全局热键钩子正常监听、内存成功注入且绝不闪退。
              </p>
            </div>
          </div>

          {/* 开关组件 */}
          <TypewriterTooltip text="开启或关闭启动修改器时的管理员提权授权请求" position="left">
            <button
              type="button"
              onClick={() => onUpdateHotkey({ run_as_admin: !hotkey.run_as_admin })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hotkey.run_as_admin ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hotkey.run_as_admin ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </TypewriterTooltip>
        </div>
      </PaperCard>

      {/* 卡片 2：⚡ 模拟按键防吞键微调引擎 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <Sliders className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              模拟按键时序与防吞键引擎
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              在点击“一键同步”时，系统将依序模拟键盘按键。通过微调按键间隔与持续时长，可彻底消除不同游戏引擎（卡普空 RE、虚幻引擎等）因连击过快导致的按键丢失。
            </p>
          </div>
        </div>

        {/* 滑块 1：按键间隔 */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              热键按序触发间隔 (Interval)
            </span>
            <span className="font-mono font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
              {hotkey.key_interval_ms} ms
            </span>
          </div>
          <FluidSlider
            min={20}
            max={300}
            step={5}
            value={hotkey.key_interval_ms}
            onChange={(val) => onUpdateHotkey({ key_interval_ms: val })}
            formatValue={(val) => `${val} ms`}
            color="cyan"
            marks={[
              { value: 20, label: "20 ms (极速激进)" },
              { value: 100, label: "100 ms (推荐标准)" },
              { value: 300, label: "300 ms (老游戏从容)" },
            ]}
          />
        </div>

        {/* 滑块 2：单键按下时长 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-slate-400" />
              单个按键保持按下时长 (Hold Duration)
            </span>
            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              {hotkey.key_hold_ms} ms
            </span>
          </div>
          <FluidSlider
            min={15}
            max={150}
            step={5}
            value={hotkey.key_hold_ms}
            onChange={(val) => onUpdateHotkey({ key_hold_ms: val })}
            formatValue={(val) => `${val} ms`}
            color="amber"
            marks={[
              { value: 15, label: "15 ms (瞬时点触)" },
              { value: 40, label: "40 ms (默认稳定)" },
              { value: 150, label: "150 ms (深按确认)" },
            ]}
          />
        </div>

        {/* 推荐调优说明 */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <span>
            <strong>小贴士</strong>：若在游戏里发现有一半功能没有被激活，通常是按键太快被游戏内部输入队列吃掉了。建议将间隔调至 <strong>100~150ms</strong> 即可完美解决。
          </span>
        </div>
      </PaperCard>

      {/* 卡片 3：🎮 一键双启联动策略 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="gentle">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
              <Play className="w-5 h-5 fill-indigo-600" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              一键双启感知与自动同步预设
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              在启动页点击“一键双启”时，系统将唤起 Steam 游戏并拉起修改器。此选项决定是否在游戏主界面加载完成后，自动为您激活所有开关预设。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3">
          {/* 开关：双启时自动同步预设 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                一键双启后自动模拟按键开启已保存的功能预设
              </span>
              <p className="text-[11px] text-slate-400">
                免去每次进游戏都得手动点一次“一键同步”的重复繁琐操作
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateHotkey({
                  auto_sync_on_double_launch: !hotkey.auto_sync_on_double_launch,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hotkey.auto_sync_on_double_launch ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hotkey.auto_sync_on_double_launch ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* 延迟等待秒数滑块 */}
          {hotkey.auto_sync_on_double_launch && (
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  启动游戏后延迟执行按键同步 (等待游戏加载进菜单)
                </span>
                <span className="font-mono font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                  {hotkey.double_launch_delay_sec} 秒
                </span>
              </div>
              <FluidSlider
                min={1}
                max={15}
                step={1}
                value={hotkey.double_launch_delay_sec}
                onChange={(val) =>
                  onUpdateHotkey({ double_launch_delay_sec: val })
                }
                formatValue={(val) => `${val} 秒`}
                color="indigo"
                marks={[
                  { value: 1, label: "1 秒 (极速就绪)" },
                  { value: 5, label: "5 秒 (推荐均衡)" },
                  { value: 15, label: "15 秒 (大型 3A 慢加载)" },
                ]}
              />
            </div>
          )}

          {/* 开关：模拟完成气泡提示 */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-slate-800">
              热键模拟完成时在右下角弹出状态反馈气泡
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateHotkey({
                  show_sync_toast: !hotkey.show_sync_toast,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hotkey.show_sync_toast ? "bg-cyan-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hotkey.show_sync_toast ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </PaperCard>

      {/* 卡片 4：🔄 全局预设备份、恢复与重置 */}
      <PaperCard className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <JellyIcon intensity="bouncy">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
              <RotateCcw className="w-5 h-5" />
            </div>
          </JellyIcon>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              全局预设备份、迁移与重置
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              在所有游戏中精心调整的个性化开挂功能开关预设（如无敌、无限金币等），支持一键打包备份与跨设备恢复。
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          {/* 导出备份 */}
          <TypewriterTooltip text="将当前所有游戏的开关预设打包导出为 JSON 剪贴板文本" position="top">
            <button
              type="button"
              onClick={onExportPresets}
              className="px-4 py-2 bg-primary bg-primary-hover active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <JellyIcon intensity="gentle">
                <Download className="w-3.5 h-3.5 text-white" />
              </JellyIcon>
              <span>导出所有预设 (JSON)</span>
            </button>
          </TypewriterTooltip>

          {/* 导入预设 */}
          <TypewriterTooltip text="粘贴之前导出的 JSON 预设备份并覆盖还原" position="top">
            <button
              type="button"
              onClick={onOpenImportModal}
              className="px-4 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <JellyIcon intensity="gentle">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
              </JellyIcon>
              <span>导入恢复预设</span>
            </button>
          </TypewriterTooltip>

          {/* 清空所有预设 */}
          <TypewriterTooltip text="彻底清空全部修改器的已开启开关记忆" position="top">
            <button
              type="button"
              onClick={onOpenClearConfirm}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200/70 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
            >
              <JellyIcon intensity="gentle">
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              </JellyIcon>
              <span>清空全部预设</span>
            </button>
          </TypewriterTooltip>
        </div>
      </PaperCard>
    </PaperContainer>
  );
};