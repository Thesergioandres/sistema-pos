"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";

// Precarga de datos de la app tras iniciar sesión
export default function PreloadAppData() {
  const { status } = useSession();
  const { mutate } = useSWRConfig();
  const { swrFetcher } = useAuthFetch();

  useEffect(() => {
    if (status !== "authenticated") return;
    const controller = new AbortController();
    const run = async () => {
      try {
        const payload = await swrFetcher("/api/bootstrap", {
          signal: controller.signal,
        });
        // Poblar caché por claves conocidas si vienen en payload
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
      } catch {
        // Ignorar errores de bootstrap
      }
    };
    run();
    return () => controller.abort();
  }, [status, mutate, swrFetcher]);

  return null;
}
