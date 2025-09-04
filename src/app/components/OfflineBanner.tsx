"use client";
import React, { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50 shadow">
      Estás sin conexión. Algunas funciones pueden estar limitadas.
    </div>
  );
}
