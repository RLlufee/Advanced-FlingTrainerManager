import React from "react";
import { Check, AlertCircle, Sparkles } from "lucide-react";
import { ToastInfo } from "./hooks/useLaunchToast";

export const LaunchToast: React.FC<{ toast: ToastInfo | null }> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="absolute top-4 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md border ${
          toast.type === "success"
            ? "bg-emerald-950/85 text-emerald-300 border-emerald-500/40"
            : toast.type === "error"
            ? "bg-rose-950/85 text-rose-300 border-rose-500/40"
            : "bg-cyan-900/95 text-cyan-200 border-cyan-500/40 shadow-primary-glow"
        }`}
      >
        {toast.type === "success" ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : toast.type === "error" ? (
          <AlertCircle className="w-4 h-4 text-rose-400" />
        ) : (
          <Sparkles className="w-4 h-4 text-cyan-400" />
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
