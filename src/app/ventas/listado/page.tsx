"use client";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { withRole } from "@/app/components/withRole";
import { withPermission } from "@/app/components/withPermission";
import { useAuthFetch } from "@/lib/useAuthFetch";

interface Venta {
  id: number;
  fecha: string;
  usuarioId: number;
  total: number;
}
interface Usuario {
  id: number;
  nombre: string;
}

function VentasListadoPage() {
  const { swrFetcher } = useAuthFetch();
  const {
    data: ventasResp,
    isLoading,
    error,
  } = useSWR<Venta[] | { error: string }>("/api/ventas", (url: string) =>
    swrFetcher(url)
  );
  const ventas: Venta[] = useMemo(() => {
    return Array.isArray(ventasResp) ? ventasResp : [];
  }, [ventasResp]);
  const { data: usuariosResp } = useSWR<Usuario[] | { error: string }>(
    "/api/usuarios",
    (url: string) => swrFetcher(url)
  );
  const usuarios: Usuario[] = Array.isArray(usuariosResp) ? usuariosResp : [];

  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [usuarioId, setUsuarioId] = useState("");

  const filtradas = useMemo(() => {
    return ventas.filter((v) => {
      if (desde && v.fecha.slice(0, 10) < desde) return false;
      if (hasta && v.fecha.slice(0, 10) > hasta) return false;
      if (usuarioId && String(v.usuarioId) !== usuarioId) return false;
      if (q && !String(v.id).includes(q)) return false;
      return true;
    });
  }, [ventas, desde, hasta, usuarioId, q]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Listado de ventas</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          placeholder="Buscar por ID"
          className="border p-2 rounded w-40"
          value={q}
          onChange={(e) => setQ(e.target.value.replace(/\D/g, ""))}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="table-wrapper">
        {isLoading && <div className="py-8 text-center">Cargando...</div>}
        {error && <div className="text-red-600">Error al cargar</div>}
        {!isLoading && !error && (
          <table className="table-base" aria-label="Tabla de ventas">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td className="text-center">{v.id}</td>
                  <td>{v.fecha.slice(0, 10)}</td>
                  <td>
                    {usuarios.find((u) => u.id === v.usuarioId)?.nombre ||
                      v.usuarioId}
                  </td>
                  <td>${v.total.toFixed(2)}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No hay ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default withPermission(
  withRole(VentasListadoPage, ["admin", "supervisor", "vendedor", "cajero"]),
  ["ventas.listado"]
);
