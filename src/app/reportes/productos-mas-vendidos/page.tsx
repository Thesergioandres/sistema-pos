"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { exportarVentasExcel } from "../ExportarExcel";
import { exportarVentasPDF } from "../ExportarPDF";
import { useAuthFetch } from "@/lib/useAuthFetch";

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
  const [preset, setPreset] = useState<
    "hoy" | "semana" | "mes" | "anio" | "custom"
  >("hoy");
  const debounceRef = useRef<number | null>(null);
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [exportMsg, setExportMsg] = useState("");
  const { authFetch } = useAuthFetch();
  const todayStr = new Date().toISOString().slice(0, 10);

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
  // Restaurar filtros persistidos
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pmv_filters");
      if (raw) {
        const obj = JSON.parse(raw) as { desde?: string; hasta?: string };
        if (obj.desde) setDesde(obj.desde);
        if (obj.hasta) setHasta(obj.hasta);
      }
    } catch {}
  }, []);

  // Aplicar presets de fechas
  useEffect(() => {
    if (preset === "custom") return;
    const hoy = new Date();
    let d = "";
    let h = "";
    if (preset === "hoy") {
      d = hoy.toISOString().slice(0, 10);
      h = d;
    } else if (preset === "semana") {
      const primerDia = new Date(hoy);
      primerDia.setDate(hoy.getDate() - hoy.getDay());
      const ultimoDia = new Date(primerDia);
      ultimoDia.setDate(primerDia.getDate() + 6);
      d = primerDia.toISOString().slice(0, 10);
      h = ultimoDia.toISOString().slice(0, 10);
    } else if (preset === "mes") {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      d = primerDia.toISOString().slice(0, 10);
      h = ultimoDia.toISOString().slice(0, 10);
    } else if (preset === "anio") {
      const primerDia = new Date(hoy.getFullYear(), 0, 1);
      const ultimoDia = new Date(hoy.getFullYear(), 11, 31);
      d = primerDia.toISOString().slice(0, 10);
      h = ultimoDia.toISOString().slice(0, 10);
    }
    setDesde(d);
    setHasta(h);
  }, [preset]);

  // Fetch con debounce y persistencia
  useEffect(() => {
    const controller = new AbortController();
    let url = "";
    if (sucursalId) {
      url = `/api/reportes/productos-mas-vendidos?sucursalId=${sucursalId}`;
    } else {
      const negocioId =
        typeof window !== "undefined"
          ? localStorage.getItem("negocioId")
          : null;
      url = negocioId
        ? `/api/reportes/productos-mas-vendidos?negocioId=${negocioId}`
        : "/api/reportes/productos-mas-vendidos";
    }
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (params.toString()) {
      url += (url.includes("?") ? "&" : "?") + params.toString();
    }
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          "pmv_filters",
          JSON.stringify({
            desde: desde || undefined,
            hasta: hasta || undefined,
          })
        );
      } catch {}
      setLoading(true);
      authFetch(url, { signal: controller.signal })
        .then((res) => res.json())
        .then(setRanking)
        .catch(() => setError("Error al cargar ranking"))
        .finally(() => setLoading(false));
    }, 400);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      controller.abort();
    };
  }, [sucursalId, desde, hasta, authFetch]);

  const tieneFiltros = useMemo(() => !!(desde || hasta), [desde, hasta]);

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
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Productos más vendidos</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-2">
          <button
            className={`px-3 py-2 rounded border ${
              preset === "hoy" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("hoy")}
          >
            Hoy
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "semana" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("semana")}
          >
            Semana
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "mes" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("mes")}
          >
            Mes
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "anio" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("anio")}
          >
            Año
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "custom" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("custom")}
          >
            Personalizado
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border p-2 rounded"
            max={todayStr}
            disabled={preset !== "custom"}
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border p-2 rounded"
            max={todayStr}
            disabled={preset !== "custom"}
          />
          {!rangoFechasValido && (
            <span className="text-xs text-red-600">
              Rango de fechas inválido
            </span>
          )}
        </div>
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="border p-2 rounded"
          disabled={preset !== "custom"}
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="border p-2 rounded"
          disabled={preset !== "custom"}
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
          className="border px-4 py-2 rounded"
          onClick={() => {
            setPreset("hoy");
            setDesde("");
            setHasta("");
            try {
              localStorage.removeItem("pmv_filters");
            } catch {}
          }}
          disabled={!tieneFiltros && preset === "hoy"}
        >
          Limpiar filtros
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
      {loading && <div className="py-8 text-center">Cargando...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad vendida</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((p, i) => (
                <tr
                  key={p.productoId}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td className="text-center">{i + 1}</td>
                  <td className="break-anywhere">{p.nombre}</td>
                  <td className="text-right">${p.precio.toFixed(2)}</td>
                  <td className="text-center">{p.cantidadVendida}</td>
                  <td className="text-right font-bold">
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
        </div>
      )}
    </div>
  );
}
