"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type Toast = {
  id: number;
  message: string;
  type?: "success" | "error" | "info" | "primary";
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
};

const ToastCtx = createContext<{
  show: (msg: string, type?: Toast["type"], durationMs?: number) => void;
  showAction: (
    msg: string,
    actionLabel: string,
    onAction: () => void,
    type?: Toast["type"],
    durationMs?: number
  ) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback(
    (message: string, type: Toast["type"] = "info", durationMs = 2500) => {
      const id = Math.floor(Date.now() + Math.random() * 1000);
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration: durationMs },
      ]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        durationMs
      );
    },
    []
  );

  const showAction = useCallback(
    (
      message: string,
      actionLabel: string,
      onAction: () => void,
      type: Toast["type"] = "info",
      durationMs = 8000
    ) => {
      const id = Math.floor(Date.now() + Math.random() * 1000);
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration: durationMs, actionLabel, onAction },
      ]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
      return () => clearTimeout(timer);
    },
    []
  );

  const value = useMemo(() => ({ show, showAction }), [show, showAction]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "px-4 py-2 rounded shadow text-white " +
              (t.type === "success"
                ? "bg-green-600"
                : t.type === "error"
                ? "bg-red-600"
                : t.type === "primary"
                ? "bg-blue-600"
                : "bg-zinc-800")
            }
          >
            <div className="flex items-center gap-3">
              <span>{t.message}</span>
              {t.actionLabel && t.onAction && (
                <button
                  className="ml-auto underline text-white/90 hover:text-white"
                  onClick={() => t.onAction?.()}
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
