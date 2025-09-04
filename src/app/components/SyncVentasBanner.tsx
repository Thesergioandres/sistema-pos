"use client";
import React from "react";
import { useSyncVentasOffline } from "../hooks/useSyncVentasOffline";

export default function SyncVentasBanner() {
  const { pendientes, syncing, lastSync, error } = useSyncVentasOffline();

  if (pendientes.length === 0 && !syncing && !error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-900 rounded px-4 py-2 shadow-lg flex flex-col gap-1 min-w-[220px]">
      {syncing && (
        <div className="flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></span>
          Sincronizando ventas pendientes...
        </div>
      )}
      {pendientes.length > 0 && !syncing && (
        <div>
          <b>{pendientes.length}</b> venta(s) pendiente(s) por sincronizar.
        </div>
      )}
      {lastSync && (
        <div className="text-xs text-gray-600">
          Última sincronización: {lastSync.toLocaleTimeString()}
        </div>
      )}
      {error && <div className="text-xs text-red-600">Error: {error}</div>}
    </div>
  );
}
