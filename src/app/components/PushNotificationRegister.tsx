"use client";
import { useCallback } from "react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

// Convierte una VAPID public key base64-url a Uint8Array requerida por PushManager
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationRegister() {
  const { authFetch } = useAuthFetch();
  const { show } = useToast();

  const subscribe = useCallback(async () => {
    try {
      if (process.env.NODE_ENV !== "production") {
        show("Push solo se registra en producción", "info");
        return;
      }
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        show("Push no soportado en este navegador", "info");
        return;
      }

      // Pedir permiso de notificaciones primero
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        show("Permiso de notificaciones denegado", "info");
        return;
      }

      // Registrar el SW de push (idempotente si ya existe)
      await navigator.serviceWorker.register("/push-sw.js");

      const reg = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(
        "BKhRytEsWAZAhgPLVVgZq_S-ibwnNatIS1HkuPR7RwEicWjmkED9CGMMXKBa80UZNZJfAdss02j29qvVy27Usfk"
      );
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const res = await authFetch("/api/push-subscription", {
        method: "POST",
        body: sub,
      });
      if (res.ok) show("Notificaciones push activadas", "success");
      else show("No se pudo guardar la suscripción push", "error");
    } catch (err) {
      console.error("Error al activar push:", err);
      show("Error al activar notificaciones push", "error");
    }
  }, [authFetch, show]);

  return (
    <button
      onClick={subscribe}
      className="bg-green-600 text-white px-4 py-2 rounded mb-4"
    >
      Activar notificaciones push
    </button>
  );
}
