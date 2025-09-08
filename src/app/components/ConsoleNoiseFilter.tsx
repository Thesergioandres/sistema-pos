"use client";
import { useEffect } from "react";

// Silencia errores ruidosos de extensiones (Chrome) en desarrollo
export default function ConsoleNoiseFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = typeof reason === "string" ? reason : reason?.message;
      if (
        typeof msg === "string" &&
        msg.includes(
          "Could not establish connection. Receiving end does not exist"
        )
      ) {
        // Silenciar este ruido específico en dev
        if (typeof console !== "undefined") {
          console.info(
            "[silenced] Chrome extension noise: Receiving end does not exist"
          );
        }
        event.preventDefault();
      }
    };
    const errHandler = (event: ErrorEvent) => {
      const msg = event?.message || "";
      if (
        typeof msg === "string" &&
        msg.includes(
          "Could not establish connection. Receiving end does not exist"
        )
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    window.addEventListener("error", errHandler);
    return () => {
      window.removeEventListener("unhandledrejection", handler);
      window.removeEventListener("error", errHandler);
    };
  }, []);
  return null;
}
