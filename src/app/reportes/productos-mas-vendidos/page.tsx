"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { exportarVentasExcel } from "../ExportarExcel";
import { exportarVentasPDF } from "../ExportarPDF";

interface ProductoRanking {
  productoId: number;
  nombre: string;
  precio: number;
  cantidadVendida: number;
  ingresos: number;
}

export default function ProductosMasVendidosPage() {
  const [ranking, setRanking] = useState<ProductoRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [exportMsg, setExportMsg] = useState("");

  const rangoFechasValido =
    (!desde && !hasta) ||
    (desde &&
      hasta &&
      desde <= hasta &&
      desde.length === 10 &&
      hasta.length === 10);

  // Filtro de sucursal activa y fechas
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  useEffect(() => {
    let url = sucursalId
      ? `/api/reportes/productos-mas-vendidos?sucursalId=${sucursalId}`
      : "/api/reportes/productos-mas-vendidos";
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (params.toString()) {
      url += (url.includes("?") ? "&" : "?") + params.toString();
    }
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then(setRanking)
      .catch(() => setError("Error al cargar ranking"))
      .finally(() => setLoading(false));
  }, [sucursalId, desde, hasta]);

  const handleExportarExcel = async () => {
    if (!rangoFechasValido) {
      setError("Rango de fechas inválido");
      setExportMsg("");
      return;
    }
    setExportando("excel");
    setExportMsg("");
    try {
      const rows = ranking.map((p) => ({
        id: p.productoId,
        producto: p.nombre,
        cantidad: p.cantidadVendida,
        total: p.ingresos,
      }));
      await exportarVentasExcel(rows, "productos-mas-vendidos.xlsx");
      setExportMsg("Exportación a Excel exitosa");
    } catch {
      setExportMsg("Error al exportar a Excel");
    } finally {
      setExportando(null);
      setTimeout(() => setExportMsg(""), 2500);
    }
  };
  const handleExportarPDF = async () => {
    if (!rangoFechasValido) {
      setError("Rango de fechas inválido");
      setExportMsg("");
      return;
    }
    setExportando("pdf");
    setExportMsg("");
    try {
      await exportarVentasPDF(
        ranking.map((p, i) => ({
          id: i + 1,
          fecha: "",
          usuarioNombre: "",
          total: p.ingresos,
        })),
        "productos-mas-vendidos.pdf"
      );
      setExportMsg("Exportación a PDF exitosa");
    } catch {
      setExportMsg("Error al exportar a PDF");
    } finally {
      setExportando(null);
      setTimeout(() => setExportMsg(""), 2500);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Productos más vendidos</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={handleExportarExcel}
          disabled={
            ranking.length === 0 || exportando === "excel" || !rangoFechasValido
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
            ranking.length === 0 || exportando === "pdf" || !rangoFechasValido
          }
          aria-busy={exportando === "pdf"}
        >
          {exportando === "pdf" && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar PDF
        </button>
        {exportMsg && (
          <div
            className={
              exportMsg.includes("Error")
                ? "text-red-600 mb-2"
                : "text-green-600 mb-2"
            }
          >
            {exportMsg}
          </div>
        )}
      </div>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">#</th>
              <th className="p-2 border">Producto</th>
              <th className="p-2 border">Precio</th>
              <th className="p-2 border">Cantidad vendida</th>
              <th className="p-2 border">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((p, i) => (
              <tr key={p.productoId}>
                <td className="p-2 border text-center">{i + 1}</td>
                <td className="p-2 border">{p.nombre}</td>
                <td className="p-2 border text-right">
                  ${p.precio.toFixed(2)}
                </td>
                <td className="p-2 border text-center">{p.cantidadVendida}</td>
                <td className="p-2 border text-right font-bold">
                  ${p.ingresos.toFixed(2)}
                </td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
