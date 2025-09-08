import React from "react";

export default function BannerEstado({ offline }: { offline: boolean }) {
  return offline ? (
    <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 rounded p-2 text-center mb-4 animate-pulse">
      Estás en modo offline. Las ventas se guardarán localmente y se
      sincronizarán al reconectar.
    </div>
  ) : null;
}
