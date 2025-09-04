"use client";
import { withRole } from "../components/withRole";
import React, { useEffect, useState } from "react";
import { useSyncVentasOffline } from "../hooks/useSyncVentasOffline";
import SyncVentasBanner from "../components/SyncVentasBanner";
import useSWR from "swr";
import { useSession } from "next-auth/react";

import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";
import { registrarVenta } from "../utils/registrarVenta";

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

function VentasPage() {
  const { data: productos = [] } = useSWR("/api/productos", (url: string) =>
    fetch(url).then((r) => r.json())
  );
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [mensaje, setMensaje] = useState<string>("");
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [ventasLoading, setVentasLoading] = useState(false);
  const rangoFechasValido = true; // Ajusta según tu lógica de validación

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then(setUsuarios);
  }, []);

  // ...carga de ventas, hooks offline, etc...

  const handleExportarExcel = async () => {
    setExportando("excel");
    try {
      const rows = ventas.map((v: Venta) => ({
        id: v.id,
        producto: "Venta",
        cantidad: 1,
        total: v.total,
      }));
      await exportarVentasExcel(rows, "ventas.xlsx");
      setMensaje("Exportación a Excel exitosa");
    } catch {
      setMensaje("Error al exportar a Excel");
    } finally {
      setExportando(null);
      setTimeout(() => setMensaje(""), 2500);
    }
  };
  const handleExportarPDF = async () => {
    setExportando("pdf");
    try {
      const rows = ventas.map((v: Venta) => ({
        id: v.id,
        fecha: v.fecha,
        usuarioNombre: String(
          usuarios.find((u) => u.id === v.usuarioId)?.nombre || v.usuarioId
        ),
        total: v.total,
      }));
      await exportarVentasPDF(rows, "ventas.pdf");
      setMensaje("Exportación a PDF exitosa");
    } catch {
      setMensaje("Error al exportar a PDF");
    } finally {
      setExportando(null);
      setTimeout(() => setMensaje(""), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      <SyncVentasBanner />
      <div className="flex flex-col md:flex-row md:items-end gap-2 mb-4">
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:gap-2">
          <label className="text-sm">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border p-2 rounded"
            aria-label="Filtrar desde fecha"
          />
        </div>
        <div className="flex flex-col gap-1 md:flex-row md:items-end md:gap-2">
          <label className="text-sm">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border p-2 rounded"
            aria-label="Filtrar hasta fecha"
          />
        </div>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={handleExportarExcel}
          disabled={
            ventas.length === 0 || exportando === "excel" || !rangoFechasValido
          }
          aria-busy={exportando === "excel"}
        >
          {exportando === "excel" && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar Excel
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={handleExportarPDF}
          disabled={
            ventas.length === 0 || exportando === "pdf" || !rangoFechasValido
          }
          aria-busy={exportando === "pdf"}
        >
          {exportando === "pdf" && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar PDF
        </button>
        {!rangoFechasValido && (
          <span className="text-red-500 text-xs">Rango de fechas inválido</span>
        )}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => window.location.reload()}
        >
          <span className="material-icons" style={{ fontSize: 18 }}>
            refresh
          </span>
          Recargar
        </button>
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
          const productoId = Number(
            (form.productoId as HTMLSelectElement).value
          );
          const cantidad = Number((form.cantidad as HTMLInputElement).value);
          const usuarioId = session?.user?.id;
          const medioPago = (form.medioPago as HTMLSelectElement).value;
          const producto = productos.find((p: any) => p.id === productoId);
          if (!productoId || !cantidad || !usuarioId || !producto) {
            setMensaje("Completa todos los campos");
            return;
          }
          const total = producto.precio * cantidad;
          try {
            await registrarVenta({
              usuarioId,
              productos: [{ productoId, cantidad }],
              total,
              pagos: [{ tipo: medioPago, monto: total }],
              cambio: 0,
            });
            setMensaje(
              navigator.onLine
                ? "Venta registrada"
                : "Venta guardada offline, se sincronizará"
            );
            form.reset();
          } catch (err: any) {
            setMensaje(err?.message || "Error al registrar venta");
          }
        }}
        aria-label="Registrar venta rápida"
      >
        <div className="flex gap-2">
          <select
            name="productoId"
            className="border p-2 rounded w-48"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona producto
            </option>
            {productos?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.tamanio ? `(${p.tamanio})` : ""} - $
                {p.precio?.toFixed(2)}
              </option>
            ))}
          </select>
          <input
            name="cantidad"
            type="number"
            min={1}
            placeholder="Cantidad"
            className="border p-2 rounded w-24"
            required
          />
          <select
            name="medioPago"
            className="border p-2 rounded w-32"
            required
            defaultValue="efectivo"
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
      <div className="overflow-x-auto">
        {ventasLoading ? (
          <div className="text-center py-8">Cargando ventas...</div>
        ) : ventas.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay ventas registradas para los filtros seleccionados.
          </div>
        ) : (
          <table className="min-w-full border" aria-label="Tabla de ventas">
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Fecha</th>
                <th className="p-2 border">Usuario</th>
                <th className="p-2 border">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta: Venta) => (
                <tr
                  key={venta.id}
                  tabIndex={0}
                  className="hover:bg-blue-50 focus:bg-blue-100 transition-colors"
                >
                  <td className="p-2 border text-center">{venta.id}</td>
                  <td className="p-2 border">{venta.fecha?.slice(0, 10)}</td>
                  <td className="p-2 border">
                    {usuarios.find((u) => u.id === venta.usuarioId)?.nombre ||
                      venta.usuarioId}
                  </td>
                  <td className="p-2 border">${venta.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default withRole(VentasPage, ["admin", "vendedor"]);
