/**
 * 全局按钮样式规范
 *
 * 原则：一个视图里只允许出现一个实心主按钮（primary，强调色），其余操作一律用
 * secondary（中性描边）或 soft（强调色浅底）。warning 仅用于"有新版本"这类需要提醒的操作。
 *
 * 禁用态统一为中性灰，而不是把彩色按钮调成半透明——半透明的彩色看起来像另一种颜色，
 * 用户分不清是"禁用"还是"另一个功能"。
 *
 * 注意：这里刻意使用 Tailwind 的 cyan 色阶（已在 index.css 中重定向到主题强调色），
 * 而不是 index.css 里的 .bg-primary 等自定义类。自定义类不在 @layer 中，优先级会压过
 * 所有 disabled: / hover: 变体，导致禁用态无法覆盖背景色。
 */

type ButtonVariant = "primary" | "secondary" | "soft" | "warning";
type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 " +
  "cursor-pointer enabled:active:scale-[0.97] disabled:cursor-not-allowed " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 rounded-lg text-xs",
  md: "h-10 px-4 rounded-xl text-[13px]",
};

const VARIANTS: Record<ButtonVariant, string> = {
  // 字重随层级递减：主按钮 semibold，其余 medium，避免次级按钮与主按钮一样"重"
  primary:
    "font-semibold bg-cyan-600 enabled:hover:bg-cyan-700 text-white shadow-sm shadow-cyan-900/15 " +
    "disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none " +
    "dark:disabled:bg-slate-800 dark:disabled:text-slate-500",
  secondary:
    "font-medium bg-white enabled:hover:bg-slate-50 text-slate-700 border border-slate-200 " +
    "dark:bg-slate-800/60 dark:enabled:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 " +
    "disabled:text-slate-400 dark:disabled:text-slate-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/30",
  soft:
    "font-medium bg-cyan-50 enabled:hover:bg-cyan-100 text-cyan-700 border border-cyan-200 " +
    "dark:bg-cyan-500/10 dark:enabled:hover:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30 " +
    "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 " +
    "dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:disabled:border-slate-700",
  warning:
    "font-medium bg-amber-50 enabled:hover:bg-amber-100 text-amber-700 border border-amber-200 " +
    "dark:bg-amber-500/10 dark:enabled:hover:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 " +
    "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 " +
    "dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:disabled:border-slate-700",
};

export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  extra = ""
): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}${extra ? ` ${extra}` : ""}`;
}
