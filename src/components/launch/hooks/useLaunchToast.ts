import { useState, useRef, useEffect, useCallback } from "react";

export interface ToastInfo {
  type: "success" | "error" | "info";
  message: string;
}

export function useLaunchToast() {
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return { toast, showToast };
}
