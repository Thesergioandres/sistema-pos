"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { exportarVentasExcel } from "../ExportarExcel";
import { exportarVentasPDF } from "../ExportarPDF";

interface Pago {
  id: number;
  tipo: string;
  monto: number;
}
interface Venta {
  id: number;
  fecha: string;
  usuario: { nombre: string };
  total: number;
  pagos: Pago[];
}

import { useSession } from "next-auth/react";

export default function PagosDivididosReporte() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  let pagosUrl = sucursalId
    ? `/api/reportes/pagos-divididos?sucursalId=${sucursalId}`
    : "/api/reportes/pagos-divididos";
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  if (params.toString()) {
    pagosUrl += (pagosUrl.includes("?") ? "&" : "?") + params.toString();
  }
  const {
    data: ventas = [],
    isLoading,
    error,
  } = useSWR<Venta[]>(pagosUrl, (url: string) =>
    fetch(url).then((r) => r.json())
  );

  const handleExportarExcel = () => {
    const rows = ventas.map((venta) => ({
      id: venta.id,
      producto: "Pagos divididos",
      cantidad: venta.pagos.length,
      total: venta.total,
    }));
    exportarVentasExcel(rows, "pagos-divididos.xlsx");
  };
  const handleExportarPDF = () => {
    exportarVentasPDF(
      ventas.map((venta) => ({
        id: venta.id,
        fecha: venta.fecha,
        usuarioNombre: venta.usuario?.nombre,
        total: venta.total,
      })),
      "pagos-divididos.pdf"
    );
  };

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error al cargar reporte</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Reporte de Pagos Divididos</h1>
        <div className="flex gap-2">
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
            onClick={handleExportarExcel}
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={ventas.length === 0}
          >
            Exportar Excel
          </button>
          <button
            onClick={handleExportarPDF}
            className="bg-red-600 text-white px-4 py-2 rounded"
            disabled={ventas.length === 0}
          >
            Exportar PDF
          </button>
        </div>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Venta</th>
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">Pagos</th>
          </tr>
        </thead>
        <tbody>
          {ventas?.map((venta) => (
            <tr key={venta.id}>
              <td className="p-2 border text-center">{venta.id}</td>
              <td className="p-2 border">
                {new Date(venta.fecha).toLocaleString()}
              </td>
              <td className="p-2 border">{venta.usuario?.nombre}</td>
              <td className="p-2 border">${venta.total.toFixed(2)}</td>
              <td className="p-2 border">
                <ul>
                  {venta.pagos.map((pago) => (
                    <li key={pago.id}>
                      {pago.tipo}:{" "}
                      <span className="font-bold">
                        ${pago.monto.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
          {ventas?.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No hay ventas con pagos divididos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
