//! 渲染帧率档位与 WebView2 启动参数决策
//!
//! 背景：WebView2 (Chromium) 默认就按显示器刷新率同步出帧（实测 165 Hz 屏即 165 FPS），
//! 并不存在 "60 Hz 锁频"。`--disable-frame-rate-limit` 的真实作用是关闭垂直同步、让合成器
//! 能跑多快跑多快（实测空闲 ~1600 FPS），会白白占满渲染主线程与 GPU。
//!
//! 因此帧率上限分两层实现：
//! 1. 启动层：只有用户选择「无上限」或高于显示器刷新率的档位时，才追加 `--disable-frame-rate-limit`；
//!    该参数只能在 WebView2 创建前设置，切换"是否解锁"需要重启应用。
//! 2. 运行层：前端按所选档位节流 requestAnimationFrame（见 src/lib/frameRateLimiter.ts），即时生效。

use std::sync::OnceLock;

/// 可选帧率档位；0 表示无上限
pub const FPS_TIERS: [u32; 6] = [30, 60, 120, 165, 240, 0];

/// 无法探测显示器刷新率时的保守假设
const FALLBACK_REFRESH_HZ: u32 = 60;

const BASE_WEBVIEW_ARGS: &str = "--enable-gpu-rasterization --ignore-gpu-blocklist";
const UNLOCK_ARG: &str = "--disable-frame-rate-limit";

static STARTUP_UNLOCKED: OnceLock<bool> = OnceLock::new();

/// 所有已接入桌面的显示器中最高的刷新率（Hz）。窗口可能被拖到任意一块屏幕上，取最大值最稳妥。
pub fn max_display_refresh_rate() -> Option<u32> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::Graphics::Gdi::{
            DEVMODEW, DISPLAY_DEVICE_ATTACHED_TO_DESKTOP, DISPLAY_DEVICEW, ENUM_CURRENT_SETTINGS,
            EnumDisplayDevicesW, EnumDisplaySettingsW,
        };

        let mut best: Option<u32> = None;
        let mut index = 0u32;
        loop {
            let mut device: DISPLAY_DEVICEW = unsafe { std::mem::zeroed() };
            device.cb = std::mem::size_of::<DISPLAY_DEVICEW>() as u32;
            if unsafe { EnumDisplayDevicesW(std::ptr::null(), index, &mut device, 0) } == 0 {
                break;
            }
            index += 1;
            if device.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP == 0 {
                continue;
            }
            let mut mode: DEVMODEW = unsafe { std::mem::zeroed() };
            mode.dmSize = std::mem::size_of::<DEVMODEW>() as u16;
            let ok = unsafe {
                EnumDisplaySettingsW(device.DeviceName.as_ptr(), ENUM_CURRENT_SETTINGS, &mut mode)
            };
            // 0 / 1 代表"硬件默认值"，不是真实刷新率
            if ok != 0 && mode.dmDisplayFrequency > 1 {
                best = Some(best.map_or(mode.dmDisplayFrequency, |b| b.max(mode.dmDisplayFrequency)));
            }
        }
        best
    }
    #[cfg(not(windows))]
    {
        None
    }
}

/// 不超过显示器刷新率的最高档位，作为未设置时的默认值（165 Hz 屏 → 165，144 Hz 屏 → 120，60 Hz 屏 → 60）
pub fn auto_target_fps(refresh: Option<u32>) -> u32 {
    let refresh = refresh.unwrap_or(FALLBACK_REFRESH_HZ);
    FPS_TIERS
        .iter()
        .copied()
        .filter(|&t| t != 0 && t <= refresh)
        .max()
        .unwrap_or(30)
}

/// 将任意数值归一到合法档位。
/// 旧版本的档位是 60/90/120/144/0，其中 144 是旧默认值（并非用户主动选择），按"自动"处理，
/// 避免 60 Hz 屏用户因为旧默认值被迁移到高于刷新率的档位而触发帧率解锁。
pub fn normalize_target_fps(value: u32, refresh: Option<u32>) -> u32 {
    if value == 0 {
        return 0;
    }
    if value == 144 {
        return auto_target_fps(refresh);
    }
    if FPS_TIERS.contains(&value) {
        return value;
    }
    // 其余旧值（如 90）就近取档，距离相同时取较高档
    FPS_TIERS
        .iter()
        .copied()
        .filter(|&t| t != 0)
        .min_by_key(|&t| ((t as i64 - value as i64).abs(), std::cmp::Reverse(t)))
        .unwrap_or(60)
}

/// 该档位是否需要关闭垂直同步（无上限，或高于显示器刷新率）
pub fn needs_unlock(target: u32, refresh: Option<u32>) -> bool {
    target == 0 || target > refresh.unwrap_or(FALLBACK_REFRESH_HZ)
}

/// 直接读取配置文件中的帧率设置（不经过 load_config，避免在 WebView 创建前产生写盘等副作用）
fn read_configured_target_fps() -> Option<u32> {
    let path = super::config::io::get_config_file_path();
    let content = std::fs::read_to_string(path).ok()?;
    let value: serde_json::Value = serde_json::from_str(&content).ok()?;
    value
        .get("animation")?
        .get("target_fps")?
        .as_u64()
        .map(|v| v.min(u32::MAX as u64) as u32)
}

/// 生成 WebView2 启动参数，并记录本次进程是否以"解锁帧率"模式启动。必须在创建任何 WebView 之前调用。
pub fn webview_browser_args() -> String {
    let refresh = max_display_refresh_rate();
    let target = read_configured_target_fps()
        .map(|v| normalize_target_fps(v, refresh))
        .unwrap_or_else(|| auto_target_fps(refresh));
    let unlocked = needs_unlock(target, refresh);
    let _ = STARTUP_UNLOCKED.set(unlocked);
    if unlocked {
        format!("{} {}", UNLOCK_ARG, BASE_WEBVIEW_ARGS)
    } else {
        BASE_WEBVIEW_ARGS.to_string()
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FrameRateStatus {
    /// 探测到的最高显示器刷新率（Hz），探测失败为 None
    pub refresh_rate: Option<u32>,
    /// 当前进程启动时是否关闭了垂直同步
    pub unlocked_at_startup: bool,
    /// 未设置时应使用的默认档位
    pub auto_target_fps: u32,
}

pub fn status() -> FrameRateStatus {
    let refresh = max_display_refresh_rate();
    FrameRateStatus {
        refresh_rate: refresh,
        unlocked_at_startup: STARTUP_UNLOCKED.get().copied().unwrap_or(false),
        auto_target_fps: auto_target_fps(refresh),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auto_target_picks_highest_tier_not_above_refresh() {
        assert_eq!(auto_target_fps(Some(165)), 165);
        assert_eq!(auto_target_fps(Some(144)), 120);
        assert_eq!(auto_target_fps(Some(60)), 60);
        assert_eq!(auto_target_fps(Some(240)), 240);
        assert_eq!(auto_target_fps(Some(360)), 240);
        assert_eq!(auto_target_fps(None), 60);
    }

    #[test]
    fn normalize_maps_legacy_values() {
        assert_eq!(normalize_target_fps(0, Some(165)), 0);
        assert_eq!(normalize_target_fps(144, Some(60)), 60);
        assert_eq!(normalize_target_fps(144, Some(165)), 165);
        assert_eq!(normalize_target_fps(90, Some(165)), 120);
        assert_eq!(normalize_target_fps(240, Some(60)), 240);
        assert_eq!(normalize_target_fps(1000, Some(60)), 240);
    }

    #[test]
    fn unlock_only_when_unlimited_or_above_refresh() {
        assert!(needs_unlock(0, Some(165)));
        assert!(needs_unlock(240, Some(165)));
        assert!(!needs_unlock(165, Some(165)));
        assert!(!needs_unlock(60, Some(165)));
        assert!(needs_unlock(120, None));
    }
}
