"use client";
export const dynamic = "force-dynamic";
import { withRole } from "../components/withRole";
import { withPermission } from "../components/withPermission";
import React, { useEffect, useRef, useState } from "react";
import SyncVentasBanner from "../components/SyncVentasBanner";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useSession } from "next-auth/react";

import { registrarVenta } from "../utils/registrarVenta";

// Eliminamos el listado de ventas de esta página: solo registrar ventas
//

function VentasPage() {
  const { swrFetcher, authFetch } = useAuthFetch();
  const { data: session } = useSession();
  // Permisos y rol para controlar carga de productos (API protegida por catalogo.productos)
  const userObj: Record<string, unknown> | undefined =
    session?.user && typeof session.user === "object"
      ? (session.user as unknown as Record<string, unknown>)
      : undefined;
  const permisos: Record<string, boolean> =
    (userObj?.permisos as Record<string, boolean>) || {};
  const rol =
    typeof userObj?.rol === "string" ? (userObj.rol as string) : undefined;
  const canVerProductos = permisos["catalogo.productos"] || rol === "admin";
  const canVerClientes = permisos["clientes.gestion"] || rol === "admin";
  const {
    data: productosData,
    error: productosError,
    isLoading: productosLoading,
  } = useSWR(
    canVerProductos ? "/api/productos" : null,
    (url: string) => swrFetcher(url),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );
  type ProductoUI = {
    id: number;
    nombre: string;
    tamanio?: string;
    precio: number;
  };
  const productos: ProductoUI[] = Array.isArray(productosData)
    ? (productosData as ProductoUI[])
    : [];

  // Usuarios no necesarios aquí
  // Ya no cargamos el listado de ventas aquí para reducir la carga
  const [mensaje, setMensaje] = useState<string>("");
  const { data: clientes = [] } = useSWR(
    canVerClientes ? "/api/clientes" : null,
    (u: string) => swrFetcher(u),
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  const [clienteIdSel, setClienteIdSel] = useState<number | "">("");
  const [nuevoClienteVisible, setNuevoClienteVisible] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [creandoCliente, setCreandoCliente] = useState(false);
  const nombreNuevoClienteRef = useRef<HTMLInputElement | null>(null);
  // Estado controlado para mostrar precio unitario y total
  const [productoIdSel, setProductoIdSel] = useState<number | "">("");
  const [cantSel, setCantSel] = useState<string>("1");

  // Nota: no traemos usuarios aquí para no cargar de más

  useEffect(() => {
    if (nuevoClienteVisible) {
      // Enfocar el campo Nombre cuando se abre el formulario de nuevo cliente
      requestAnimationFrame(() => nombreNuevoClienteRef.current?.focus());
    }
  }, [nuevoClienteVisible]);

  // ...carga de ventas, hooks offline, etc...

  return (
    <div className="max-w-5xl mx-auto p-4 relative space-y-4">
      <SyncVentasBanner />
      <div className="flex flex-col md:flex-row md:items-end gap-2 mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => window.location.reload()}
        >
          <span className="material-icons" style={{ fontSize: 18 }}>
            refresh
          </span>
          Recargar
        </button>
        <div className="flex gap-2">
          <Link
            href="/ventas/pendientes"
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 text-center"
          >
            Ver pendientes
          </Link>
          <Link
            href="/ventas/listado"
            className="border px-4 py-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 text-center"
            prefetch={false}
          >
            Ver listado
          </Link>
        </div>
      </div>
      {mensaje && (
        <div className="mb-2 text-center font-semibold text-green-700 bg-green-100 border border-green-300 rounded p-2 animate-fade-in">
          {mensaje}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Ventas</h1>
      {/* Formulario rápido de registro de venta */}
      <form
        className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-2 max-w-xl mx-auto"
        onSubmit={async (e) => {
          e.preventDefault();
          setMensaje("");
          const form = e.target as HTMLFormElement;
          const productoId =
            typeof productoIdSel === "number" ? productoIdSel : NaN;
          const cantidad = parseInt(cantSel || "0", 10);
          const usuarioId = session?.user?.id;
          const producto = productos.find(
            (p: { id: number }) => p.id === productoId
          );
          if (!productoId || !cantidad || !usuarioId || !producto) {
            setMensaje("Completa todos los campos");
            return;
          }
          if (typeof clienteIdSel !== "number") {
            setMensaje("Selecciona un cliente");
            return;
          }
          const total = producto.precio * cantidad;
          try {
            await registrarVenta({
              usuarioId,
              productos: [{ productoId, cantidad }],
              total,
              pagos: [{ tipo: "efectivo", monto: 0 }],
              cambio: 0,
              clienteId: clienteIdSel,
            });
            setMensaje(
              navigator.onLine
                ? "Venta registrada"
                : "Venta guardada offline, se sincronizará"
            );
            form.reset();
            setProductoIdSel("");
            setCantSel("1");
            setClienteIdSel("");
          } catch (err) {
            if (err instanceof Error) setMensaje(err.message);
            else setMensaje("Error al registrar venta");
          }
        }}
        aria-label="Registrar venta rápida"
      >
        <div className="flex flex-wrap gap-2 items-start">
          <select
            name="productoId"
            className="border p-2 rounded w-full sm:w-48"
            required
            value={productoIdSel}
            onChange={(e) => {
              const v = e.target.value;
              setProductoIdSel(v ? Number(v) : "");
            }}
          >
            <option value="" disabled>
              Selecciona producto
            </option>
            {productos.map(
              (p: {
                id: number;
                nombre: string;
                tamanio?: string;
                precio: number;
              }) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.tamanio ? `(${p.tamanio})` : ""} - $
                  {p.precio?.toFixed(2)}
                </option>
              )
            )}
          </select>
          {!canVerProductos && !productosLoading && (
            <div className="text-xs text-amber-700 bg-amber-100 border border-amber-300 rounded p-2 w-full sm:w-auto">
              No tienes permiso para ver productos (catalogo.productos). Pide a
              un administrador que te lo habilite.
            </div>
          )}
          {productosError && (
            <div className="text-xs text-red-700 bg-red-100 border border-red-300 rounded p-2 w-full sm:w-auto">
              Error cargando productos
            </div>
          )}
          <select
            name="clienteId"
            className="border p-2 rounded w-full sm:w-56"
            required
            value={clienteIdSel}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__nuevo__") {
                setClienteIdSel("");
                setNuevoClienteVisible(true);
                return;
              }
              const id = val ? Number(val) : "";
              setClienteIdSel(id);
              if (val) setNuevoClienteVisible(false);
            }}
          >
            <option value="" disabled>
              Selecciona cliente
            </option>
            <option value="__nuevo__">+ Nuevo cliente…</option>
            {Array.isArray(clientes) &&
              clientes.map((c: { id: number; nombre: string }) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
          </select>
          {nuevoClienteVisible && (
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 w-full">
              <input
                ref={nombreNuevoClienteRef}
                type="text"
                placeholder="Nombre"
                className="border p-2 rounded w-full sm:w-40"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Teléfono"
                className="border p-2 rounded w-full sm:w-36"
                value={nuevoTelefono}
                onChange={(e) => setNuevoTelefono(e.target.value)}
              />
              <button
                type="button"
                disabled={creandoCliente || nuevoNombre.trim().length < 2}
                className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
                onClick={async () => {
                  setMensaje("");
                  try {
                    setCreandoCliente(true);
                    const res = await authFetch("/api/clientes", {
                      method: "POST",
                      body: {
                        nombre: nuevoNombre.trim(),
                        telefono: nuevoTelefono.trim() || undefined,
                      },
                    });
                    if (!res.ok) {
                      const j = await res.json().catch(() => ({}));
                      throw new Error(j.error || "No se pudo crear el cliente");
                    }
                    const nuevo = await res.json();
                    setClienteIdSel(nuevo.id);
                    setNuevoClienteVisible(false);
                    setNuevoNombre("");
                    setNuevoTelefono("");
                    mutate("/api/clientes");
                    setMensaje("Cliente creado");
                  } catch (err) {
                    setMensaje(
                      err instanceof Error
                        ? err.message
                        : "Error creando cliente"
                    );
                  } finally {
                    setCreandoCliente(false);
                  }
                }}
              >
                {creandoCliente ? "Creando..." : "Crear"}
              </button>
            </div>
          )}
          <input
            name="cantidad"
            type="number"
            min={1}
            placeholder="Cantidad"
            className="border p-2 rounded w-full sm:w-24"
            required
            value={cantSel}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "");
              v = v.replace(/^0+(?=\d)/, "");
              setCantSel(v);
            }}
            onBlur={() => {
              const n = parseInt(cantSel || "0", 10);
              if (!Number.isFinite(n) || n < 1) setCantSel("1");
            }}
          />
          {/* Información de precio unitario y total estimado */}
          <div className="hidden md:flex items-center gap-3 text-sm px-2">
            <span className="text-gray-600">
              Unitario: $
              {(() => {
                const p = productos.find((x: { id: number; precio: number }) =>
                  typeof productoIdSel === "number"
                    ? x.id === productoIdSel
                    : false
                );
                return (p?.precio ?? 0).toFixed(2);
              })()}
            </span>
            <span className="font-semibold">
              Total: $
              {(() => {
                const p = productos.find((x: { id: number; precio: number }) =>
                  typeof productoIdSel === "number"
                    ? x.id === productoIdSel
                    : false
                );
                const unit = p?.precio ?? 0;
                const qty = parseInt(cantSel || "0", 10);
                return (unit * (Number.isFinite(qty) ? qty : 0)).toFixed(2);
              })()}
            </span>
          </div>
          {/* La venta siempre se registrará como pendiente (pago 0) */}

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            Registrar
          </button>
        </div>
        {mensaje && (
          <div className="text-sm text-center mt-2 text-green-700">
            {mensaje}
          </div>
        )}
      </form>
      {/* El listado se movió a /ventas/listado */}
    </div>
  );
}

// Soporte de permisos granulares: si existen, se aplican; si no, cae al rol
export default withPermission(
  withRole(VentasPage, ["admin", "vendedor", "cajero"]),
  ["ventas.registrar"]
);
