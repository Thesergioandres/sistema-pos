// src/utils/offlineVentas.ts
// Utilidad para guardar y sincronizar ventas offline usando IndexedDB
import type { VentaPayload } from "@/app/hooks/types";

const DB_NAME = "pos_bebidas_offline" as const;
const STORE_NAME = "ventas" as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function guardarVentaOffline(venta: VentaPayload): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).add(venta);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenerVentasPendientes(): Promise<VentaPayload[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return await new Promise<VentaPayload[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as VentaPayload[]);
    req.onerror = () => reject(req.error);
  });
}

export async function limpiarVentasPendientes(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
