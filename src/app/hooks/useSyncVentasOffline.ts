import { useEffect, useState, useCallback } from "react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import {
  guardarVentaOffline,
  obtenerVentasPendientes,
  limpiarVentasPendientes,
} from "../../utils/offlineVentas";
import type { VentaPayload } from "./types";

export function useSyncVentasOffline() {
  const { authFetch } = useAuthFetch();
  const [pendientes, setPendientes] = useState<VentaPayload[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string>("");

  // Cargar ventas pendientes al montar
  useEffect(() => {
    obtenerVentasPendientes().then(setPendientes);
  }, []);

  // Sincronizar automáticamente al volver online
  useEffect(() => {
    const sync = async () => {
      if (navigator.onLine && pendientes.length > 0 && !syncing) {
        setSyncing(true);
        setError("");
        try {
          for (const venta of pendientes) {
            const res = await authFetch("/api/ventas", {
              method: "POST",
              body: venta,
            });
            if (!res.ok) throw new Error("Error al sincronizar venta");
          }
          await limpiarVentasPendientes();
          setPendientes([]);
          setLastSync(new Date());
        } catch (e) {
          if (e instanceof Error) setError(e.message);
          else setError("Error de sincronización");
        } finally {
          setSyncing(false);
        }
      }
    };
    window.addEventListener("online", sync);
    sync();
    return () => window.removeEventListener("online", sync);
  }, [pendientes, syncing, authFetch]);

  // Guardar venta offline si está offline
  const registrarVenta = useCallback(
    async (venta: VentaPayload) => {
      if (!navigator.onLine) {
        await guardarVentaOffline(venta);
        setPendientes(await obtenerVentasPendientes());
        return { offline: true };
      }
      // Si está online, intentar normalmente
      const res = await authFetch("/api/ventas", {
        method: "POST",
        body: venta,
      });
      if (!res.ok) throw new Error("Error al registrar venta");
      setLastSync(new Date());
      return { offline: false };
    },
    [authFetch]
  );

  return {
    pendientes,
    syncing,
    lastSync,
    error,
    registrarVenta,
  };
}
