"use client";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";
import { useState } from "react";

export default function SucursalSelector() {
  const { data: session, update } = useSession();
  const { swrFetcher, authFetch } = useAuthFetch();
  const { show } = useToast();
  const permisos: Record<string, boolean> =
    (session?.user &&
      (session.user as unknown as { permisos?: Record<string, boolean> })
        .permisos) ||
    {};
  const userObj: Record<string, unknown> | undefined =
    session?.user && typeof session.user === "object"
      ? (session.user as unknown as Record<string, unknown>)
      : undefined;
  const userRol =
    typeof userObj?.rol === "string" ? (userObj.rol as string) : undefined;
  const canListarSucursales =
    permisos["sucursales.gestion"] ||
    permisos["usuarios.gestion"] ||
    userRol === "admin";
  const {
    data: sucursalesData,
    error: sucursalesError,
    isLoading: sucursalesLoading,
  } = useSWR<{ id: number; nombre: string }[] | { error: string }>(
    canListarSucursales ? "/api/sucursales" : null,
    (url: string) => swrFetcher(url)
  );
  const sucursales = Array.isArray(sucursalesData) ? sucursalesData : [];
  const [loading, setLoading] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaDireccion, setNuevaDireccion] = useState("");
  const [creando, setCreando] = useState(false);
  const sucursalId = session?.user?.sucursalId;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__crear__") {
      setCrearOpen(true);
      return;
    }
    const nuevaSucursalId = Number(value);
    setLoading(true);
    // Actualizar sucursalId en el backend y en el token de sesión
    const res = await authFetch("/api/usuarios/cambiar-sucursal", {
      method: "POST",
      body: { sucursalId: nuevaSucursalId },
    });
    if (!res.ok) {
      show("No se pudo cambiar la sucursal", "error");
    } else {
      show("Sucursal cambiada", "success");
      await update(); // Refresca la sesión
    }
    setLoading(false);
  };

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded mb-2">
      <span className="font-semibold">Sucursal activa:</span>
      <select
        value={sucursalId || ""}
        onChange={handleChange}
        disabled={loading || (!canListarSucursales && sucursales.length === 0)}
        className="border p-1 rounded"
      >
        <option value="" className="text-black bg-white dark:bg-zinc-800">
          Selecciona sucursal
        </option>
        {canListarSucursales && (
          <option value="__crear__">+ Crear sucursal…</option>
        )}
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
        {!canListarSucursales &&
          !sucursales.length &&
          typeof sucursalId === "number" && (
            <option value={sucursalId}>Sucursal actual #{sucursalId}</option>
          )}
      </select>
      {canListarSucursales && (
        <button
          className="px-2 py-1 text-sm rounded border hover:bg-zinc-50 dark:hover:bg-zinc-800"
          onClick={() => setCrearOpen((v) => !v)}
          type="button"
        >
          {crearOpen ? "Ocultar" : "Nueva"}
        </button>
      )}
      {loading && (
        <span className="text-xs text-blue-600 ml-2">Cambiando...</span>
      )}
      {!canListarSucursales && !sucursalesLoading && (
        <span className="text-xs text-zinc-500 ml-2">
          Sin permiso para listar sucursales
        </span>
      )}
      {sucursalesError && (
        <span className="text-xs text-red-600 ml-2">
          Error cargando sucursales
        </span>
      )}
      {crearOpen && (
        <form
          className="flex items-center gap-2 ml-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (nuevoNombre.trim().length < 2) return;
            setCreando(true);
            try {
              const res = await authFetch("/api/sucursales", {
                method: "POST",
                body: {
                  nombre: nuevoNombre.trim(),
                  direccion: nuevaDireccion.trim() || undefined,
                  // Asociar al negocio activo si existe
                  negocioId:
                    typeof window !== "undefined"
                      ? Number(localStorage.getItem("negocioId") || "") ||
                        undefined
                      : undefined,
                },
              });
              if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || "No se pudo crear sucursal");
              }
              setNuevoNombre("");
              setNuevaDireccion("");
              setCrearOpen(false);
              show("Sucursal creada", "success");
            } catch (err) {
              show(
                err instanceof Error ? err.message : "Error creando sucursal",
                "error"
              );
            } finally {
              setCreando(false);
            }
          }}
        >
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre"
            className="border p-1 rounded w-40"
          />
          <input
            value={nuevaDireccion}
            onChange={(e) => setNuevaDireccion(e.target.value)}
            placeholder="Dirección (opcional)"
            className="border p-1 rounded w-56"
          />
          <button
            type="submit"
            disabled={creando || nuevoNombre.trim().length < 2}
            className="px-2 py-1 text-sm rounded bg-green-600 text-white disabled:opacity-50"
          >
            {creando ? "Creando..." : "Crear"}
          </button>
        </form>
      )}
    </div>
  );
}
