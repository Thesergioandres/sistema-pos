"use client";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

export default function ReloadDataButton() {
  const { mutate } = useSWRConfig();
  const { swrFetcher } = useAuthFetch();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = await swrFetcher("/api/bootstrap");
      const map: Record<string, string> = {
        productos: "/api/productos",
        insumos: "/api/insumos",
        recetas: "/api/recetas",
        combos: "/api/combos",
        clientes: "/api/clientes",
        ventas: "/api/ventas",
        ventasPendientes: "/api/ventas/pendientes",
        sucursales: "/api/sucursales",
        usuarios: "/api/usuarios",
        negocios: "/api/negocios",
      };
      await Promise.all(
        Object.entries(map).map(([k, key]) =>
          k in (payload || {})
            ? mutate(key, payload[k as keyof typeof payload], false)
            : Promise.resolve()
        )
      );
      show("Datos recargados", "success");
    } catch {
      show("Error al recargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={reload}
      disabled={loading}
      className="px-2 py-1 text-sm rounded border hover:bg-zinc-100 dark:hover:bg-zinc-800"
      title="Re-ejecutar precarga de datos"
      type="button"
    >
      {loading ? "Cargando..." : "Recargar datos"}
    </button>
  );
}
