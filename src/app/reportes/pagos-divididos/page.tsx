"use client";
import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";

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
  const { swrFetcher } = useAuthFetch();
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const negocioId =
    typeof window !== "undefined" ? localStorage.getItem("negocioId") : null;

  // Filtros de fecha
  const [preset, setPreset] = useState<
    "hoy" | "semana" | "mes" | "anio" | "custom"
  >("hoy");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [filtroError, setFiltroError] = useState<string>("");

  // Aplicar presets
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

  // Validación simple de fechas
  useEffect(() => {
    setFiltroError("");
    if (preset === "custom") {
      if ((desde && !hasta) || (!desde && hasta)) {
        setFiltroError("Debes seleccionar ambas fechas.");
      } else if (desde && hasta && desde > hasta) {
        setFiltroError("La fecha 'desde' no puede ser mayor que 'hasta'.");
      }
    }
  }, [preset, desde, hasta]);

  // Construir URL con filtros
  const pagosUrl = useMemo(() => {
    let base = "/api/reportes/pagos-divididos";
    if (sucursalId) base += `?sucursalId=${sucursalId}`;
    else if (negocioId) base += `?negocioId=${negocioId}`;
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (Array.from(params).length > 0) {
      base += (base.includes("?") ? "&" : "?") + params.toString();
    }
    return base;
  }, [sucursalId, negocioId, desde, hasta]);
  const {
    data: ventas = [],
    isLoading,
    error,
  } = useSWR<Venta[]>(pagosUrl, (url: string) => swrFetcher(url));

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error al cargar reporte</div>;

  const todayStr = new Date().toISOString().slice(0, 10);
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Reporte de Pagos Divididos</h1>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2 flex-wrap">
          <button
            className={`px-3 py-2 rounded border ${
              preset === "hoy" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("hoy")}
            type="button"
          >
            Hoy
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "semana" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("semana")}
            type="button"
          >
            Semana
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "mes" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("mes")}
            type="button"
          >
            Mes
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "anio" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("anio")}
            type="button"
          >
            Año
          </button>
          <button
            className={`px-3 py-2 rounded border ${
              preset === "custom" ? "bg-blue-600 text-white" : ""
            }`}
            onClick={() => setPreset("custom")}
            type="button"
          >
            Personalizado
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border p-2 rounded"
            disabled={preset !== "custom"}
            max={todayStr}
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border p-2 rounded"
            disabled={preset !== "custom"}
            max={todayStr}
          />
        </div>
        {filtroError && (
          <span className="text-red-500 text-xs">{filtroError}</span>
        )}
      </div>
      <div className="table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>Venta</th>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Total</th>
              <th>Pagos</th>
            </tr>
          </thead>
          <tbody>
            {ventas?.map((venta) => (
              <tr key={venta.id}>
                <td className="text-center">{venta.id}</td>
                <td>{new Date(venta.fecha).toLocaleString()}</td>
                <td>{venta.usuario?.nombre}</td>
                <td>${venta.total.toFixed(2)}</td>
                <td>
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
    </div>
  );
}
