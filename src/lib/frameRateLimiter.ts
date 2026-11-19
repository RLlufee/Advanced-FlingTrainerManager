/**
 * 运行层帧率上限：按设置的档位节流 requestAnimationFrame。
 *
 * 必须作为 main.tsx 的第一个 import 执行——motion 等动画库在模块初始化时就会捕获
 * window.requestAnimationFrame 的引用，晚于它们替换将不起作用。
 *
 * 作用范围：所有基于 rAF 的 JS 动画（motion 的弹簧/布局动画、自定义 rAF 循环）。
 * 浏览器合成器直接驱动的 CSS 过渡与 WAAPI 动画仍按显示器刷新率运行，它们本身开销很低。
 * 高于显示器刷新率的档位需要在启动时关闭垂直同步（见 src-tauri/src/services/frame_rate.rs）。
 */

const STORAGE_KEY = "ftm.targetFps";

type Callback = FrameRequestCallback;

let intervalMs = 0; // 0 = 不节流
let nextDue = 0;
let lastTick = 0;
let nextId = 1;
let pending = new Map<number, Callback>();
let nativeHandle: number | null = null;

const nativeRaf = window.requestAnimationFrame.bind(window);
const nativeCancel = window.cancelAnimationFrame.bind(window);

function schedule() {
  if (nativeHandle === null) nativeHandle = nativeRaf(tick);
}

function tick(now: number) {
  nativeHandle = null;
  const vsyncDelta = lastTick ? now - lastTick : 0;
  lastTick = now;

  if (intervalMs > 0) {
    // 按理想时间表推进：每放行一帧，下一帧到期时间 +interval。
    // 容差取半个原生帧，让放行点落在离到期时间最近的那次 vsync 上；
    // 由于到期时间严格按 interval 递增，长期平均帧率精确等于目标档位。
    if (now < nextDue - vsyncDelta / 2) {
      schedule();
      return;
    }
    nextDue += intervalMs;
    // 空闲后（或落后超过一帧）重新对齐，避免补帧连发
    if (now - nextDue > intervalMs) nextDue = now + intervalMs;
  }

  const callbacks = pending;
  pending = new Map();
  callbacks.forEach((cb) => {
    try {
      cb(now);
    } catch (err) {
      // 与原生 rAF 行为一致：单个回调出错不影响其它回调
      setTimeout(() => {
        throw err;
      });
    }
  });
}

window.requestAnimationFrame = (cb: Callback): number => {
  const id = nextId++;
  pending.set(id, cb);
  schedule();
  return id;
};

window.cancelAnimationFrame = (id: number) => {
  pending.delete(id);
  if (pending.size === 0 && nativeHandle !== null) {
    nativeCancel(nativeHandle);
    nativeHandle = null;
  }
};

/** 设置帧率上限；0 表示不限制 */
export function setFrameRateLimit(fps: number) {
  intervalMs = fps > 0 ? 1000 / fps : 0;
  try {
    localStorage.setItem(STORAGE_KEY, String(fps));
  } catch {
    // 存储不可用时仅影响下次启动的初始值
  }
}

// 启动时先用上次的设置，避免在配置加载完成前的首屏动画不受限
try {
  const cached = Number(localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(cached) && cached > 0) intervalMs = 1000 / cached;
} catch {
  // ignore
}
