"use client";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Usuario = { id: number; nombre: string; email: string; rol: string };
type Sucursal = { id: number; nombre: string; direccion?: string | null };
type Producto = { id: number; nombre: string; precio: number };
type Receta = {
  id: number;
  productoId: number;
  insumoId: number;
  cantidad: number;
};
type Negocio = { id: number; nombre: string };

export default function NegocioDashboard() {
  const { swrFetcher } = useAuthFetch();

  const { data: sucursales = [] } = useSWR<Sucursal[]>(
    "/api/sucursales",
    (url: string) => swrFetcher(url)
  );
  const { data: usuarios = [] } = useSWR<Usuario[]>(
    "/api/usuarios",
    (url: string) => swrFetcher(url)
  );
  const { data: productos = [] } = useSWR<Producto[]>(
    "/api/productos",
    (url: string) => swrFetcher(url)
  );
  const { data: recetasResp } = useSWR<Receta[] | { error: string }>(
    "/api/recetas",
    (url: string) => swrFetcher(url)
  );
  const recetas: Receta[] = Array.isArray(recetasResp) ? recetasResp : [];
  const { data: negocios = [] } = useSWR<Negocio[]>(
    "/api/negocios",
    (url: string) => swrFetcher(url)
  );

  const [negocioId, setNegocioId] = useState<number | undefined>(undefined);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("negocioId");
      const n = raw ? Number(raw) : NaN;
      if (Number.isFinite(n)) setNegocioId(n);
    } catch {}
  }, []);

  const negocioActivo = useMemo(() => {
    if (!Array.isArray(negocios) || negocios.length === 0) return undefined;
    if (typeof negocioId === "number") {
      return negocios.find((n) => n.id === negocioId) || negocios[0];
    }
    return negocios[0];
  }, [negocios, negocioId]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">
        {`Resumen del negocio${
          negocioActivo ? ": " + negocioActivo.nombre : ""
        }`}
      </h1>
      <p className="text-sm text-zinc-500">
        Vista general con información de sucursales, usuarios, productos y
        recetas.
      </p>

      <section>
        <h2 className="text-xl font-semibold mb-2">Sucursales</h2>
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Dirección</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(sucursales) && sucursales.length > 0 ? (
                sucursales.map((s) => (
                  <tr key={s.id}>
                    <td className="text-center">{s.id}</td>
                    <td>{s.nombre}</td>
                    <td>{s.direccion || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-zinc-500">
                    Sin datos o sin permisos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(usuarios) && usuarios.length > 0 ? (
                usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="text-center">{u.id}</td>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>{u.rol}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-zinc-500">
                    Sin datos o sin permisos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Productos</h2>
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(productos) && productos.length > 0 ? (
                productos.map((p) => (
                  <tr key={p.id}>
                    <td className="text-center">{p.id}</td>
                    <td>{p.nombre}</td>
                    <td>${Number(p.precio).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-zinc-500">
                    Sin datos o sin permisos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Recetas</h2>
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Insumo</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(recetas) && recetas.length > 0 ? (
                recetas.map((r) => (
                  <tr key={`${r.productoId}-${r.insumoId}`}>
                    <td>{r.productoId}</td>
                    <td>{r.insumoId}</td>
                    <td>{r.cantidad}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-zinc-500">
                    Sin datos o sin permisos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Informes</h2>
        <div className="flex flex-wrap gap-2">
          <Link className="btn" href="/reportes/diario">
            Diario
          </Link>
          <Link className="btn" href="/reportes/semanal">
            Semanal
          </Link>
          <Link className="btn" href="/reportes/mensual">
            Mensual
          </Link>
          <Link className="btn" href="/reportes/productos-mas-vendidos">
            Más vendidos
          </Link>
          <Link className="btn" href="/reportes/pagos-divididos">
            Pagos divididos
          </Link>
        </div>
      </section>
    </div>
  );
}
