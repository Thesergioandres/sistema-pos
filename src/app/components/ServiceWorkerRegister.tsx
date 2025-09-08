"use client";
import { useEffect } from "react";
import { useToast } from "@/components/toast/ToastProvider";

export default function ServiceWorkerRegister() {
  const { showAction } = useToast();
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return; // No registrar en dev
    // Preferir la API de next-pwa si está disponible
    const wb = (
      window as unknown as {
        workbox?: {
          register?: () => void;
          addEventListener?: (
            type: string,
            listener: (event: unknown) => void
          ) => void;
          messageSW?: (message: { type: string }) => Promise<void>;
        };
      }
    ).workbox;
    if (wb && typeof wb.register === "function") {
      try {
        // 1) Cuando el nuevo SW está esperando, ofrecer aplicar la actualización (skipWaiting)
        wb.addEventListener?.("waiting", () => {
          showAction(
            "Hay una actualización disponible",
            "Aplicar",
            async () => {
              try {
                await wb.messageSW?.({ type: "SKIP_WAITING" });
              } catch (e) {
                console.warn("No se pudo aplicar la actualización", e);
              }
            },
            "primary",
            12000
          );
        });
        // 2) Cuando el controlador cambia al nuevo SW, pedir recargar
        wb.addEventListener?.("controlling", () => {
          showAction(
            "Actualización aplicada",
            "Recargar ahora",
            () => window.location.reload(),
            "success",
            10000
          );
        });
        wb.register();
        return;
      } catch (err) {
        console.warn("workbox.register falló, se intenta fallback", err);
      }
    }
    // Fallback estándar al SW generado si existe el archivo
    if ("serviceWorker" in navigator) {
      const onLoad = async () => {
        try {
          const res = await fetch("/sw.js", { method: "HEAD" });
          if (!res.ok) return; // No hay SW disponible
          await navigator.serviceWorker.register("/sw.js");
        } catch (err) {
          console.debug("Sin Service Worker disponible:", err);
        }
      };
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    }
  }, [showAction]);
  return null;
}
