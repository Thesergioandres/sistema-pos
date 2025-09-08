"use client";
import { useEffect } from "react";

// Desactiva cualquier Service Worker previo durante desarrollo
export default function ServiceWorkerKiller() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDev = process.env.NODE_ENV !== "production";
    if (!("serviceWorker" in navigator)) return;
    // Siempre limpia en dev; también respeta un flag manual en prod
    const forceOff = localStorage.getItem("force_sw_off") === "1";
    if (!isDev && !forceOff) return;
    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      } catch {}
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.startsWith("workbox-") || k.startsWith("next-"))
              .map((k) => caches.delete(k))
          );
        }
      } catch {}
      // Forzar recarga si el SW estaba controlando
      try {
        const ctrl = navigator.serviceWorker?.controller;
        if (ctrl) {
          // No podemos reasignar controller; pedimos recarga
          window.location.reload();
        }
      } catch {}
    })();
  }, []);
  return null;
}
