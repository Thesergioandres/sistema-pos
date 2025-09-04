"use client";
import { useEffect } from "react";

export default function PushNotificationRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/push-sw.js");
    }
  }, []);

  const subscribe = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          "BKhRytEsWAZAhgPLVVgZq_S-ibwnNatIS1HkuPR7RwEicWjmkED9CGMMXKBa80UZNZJfAdss02j29qvVy27Usfk",
      });
      await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      alert("Suscripción push realizada y guardada.");
    }
  };

  return (
    <button
      onClick={subscribe}
      className="bg-green-600 text-white px-4 py-2 rounded mb-4"
    >
      Activar notificaciones push
    </button>
  );
}
