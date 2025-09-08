"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { exportarVentasExcel } from "./ExportarExcel";
import { exportarVentasPDF } from "./ExportarPDF";
import dynamic from "next/dynamic";
import { Suspense } from "react";
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});
const Pie = dynamic(() => import("react-chartjs-2").then((mod) => mod.Pie), {
  ssr: false,
});
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ArcElement,
  Legend as ChartLegend,
} from "chart.js";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ChartLegend,
  ArcElement
);

interface Venta {
  id: number;
  fecha: string;
  usuarioId: number;
  total: number;
  producto: string;
  cantidad: number;
}
interface Usuario {
  id: number;
  nombre: string;
}

export default function ReporteGeneral({
  tipo,
  sucursalId: propSucursalId,
}: {
  tipo: string;
  sucursalId?: number;
}) {
  const { authFetch } = useAuthFetch();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [preset, setPreset] = useState<"hoy" | "semana" | "mes" | "custom">(
    tipo === "personalizado" ? "hoy" : "custom"
  );
  const desdeDeb = useDebouncedValue(desde, 400);
  const hastaDeb = useDebouncedValue(hasta, 400);
  const { data: session } = useSession();
  const sucursalId =
    typeof propSucursalId !== "undefined"
      ? propSucursalId
      : session?.user?.sucursalId;
  const { data: ventas = [], isLoading: ventasLoading } = useSWR<Venta[]>(
    ["/api/ventas", tipo, desdeDeb, hastaDeb, sucursalId],
    async () => {
      let url = "/api/ventas";
      const params = new URLSearchParams();
      if (tipo === "diario") {
        const hoy = new Date().toISOString().slice(0, 10);
        params.set("desde", hoy);
        params.set("hasta", hoy);
      } else if (tipo === "semanal") {
        const hoy = new Date();
        const primerDia = new Date(hoy);
        primerDia.setDate(hoy.getDate() - hoy.getDay());
        const ultimoDia = new Date(primerDia);
        ultimoDia.setDate(primerDia.getDate() + 6);
        params.set("desde", primerDia.toISOString().slice(0, 10));
        params.set("hasta", ultimoDia.toISOString().slice(0, 10));
      } else if (tipo === "mensual") {
        const hoy = new Date();
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        params.set("desde", primerDia.toISOString().slice(0, 10));
        params.set("hasta", ultimoDia.toISOString().slice(0, 10));
      } else if (tipo === "personalizado") {
        if (preset !== "custom") {
          const hoy = new Date();
          if (preset === "hoy") {
            const d = hoy.toISOString().slice(0, 10);
            params.set("desde", d);
            params.set("hasta", d);
          } else if (preset === "semana") {
            const primerDia = new Date(hoy);
            primerDia.setDate(hoy.getDate() - hoy.getDay());
            const ultimoDia = new Date(primerDia);
            ultimoDia.setDate(primerDia.getDate() + 6);
            params.set("desde", primerDia.toISOString().slice(0, 10));
            params.set("hasta", ultimoDia.toISOString().slice(0, 10));
          } else if (preset === "mes") {
            const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const ultimoDia = new Date(
              hoy.getFullYear(),
              hoy.getMonth() + 1,
              0
            );
            params.set("desde", primerDia.toISOString().slice(0, 10));
            params.set("hasta", ultimoDia.toISOString().slice(0, 10));
          }
        } else if (desde && hasta) {
          params.set("desde", desde);
          params.set("hasta", hasta);
        }
      }
      if (sucursalId) {
        params.set("sucursalId", String(sucursalId));
      } else {
        // Usar negocioId del selector persistido para consolidar sucursales
        const negocioId =
          typeof window !== "undefined"
            ? localStorage.getItem("negocioId")
            : null;
        if (negocioId) params.set("negocioId", negocioId);
      }
      if (Array.from(params).length > 0) {
        url += `?${params.toString()}`;
      }
      const res = await authFetch(url);
      return res.json();
    },
    { revalidateOnFocus: false, keepPreviousData: true }
  );
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState<string>("");
  const [filtroError, setFiltroError] = useState<string>("");
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [exportMsg, setExportMsg] = useState<string>("");

  useEffect(() => {
    const abort = new AbortController();
    authFetch("/api/usuarios", { headers: {}, method: "GET" })
      .then((res) => res.json())
      .then(setUsuarios)
      .catch(() => void 0);
    return () => {
      abort.abort();
    };
  }, [authFetch]);

  useEffect(() => {
    setFiltroError("");
    if (tipo === "personalizado" && desde && hasta && desde > hasta) {
      setFiltroError("La fecha 'desde' no puede ser mayor que 'hasta'.");
    } else if (
      tipo === "personalizado" &&
      (desde || hasta) &&
      !(desde && hasta)
    ) {
      setFiltroError("Debes seleccionar ambas fechas.");
    }
  }, [tipo, desde, hasta]);

  // Filtro por usuario
  const ventasFiltradas = usuarioId
    ? ventas.filter((v) => v.usuarioId === Number(usuarioId))
    : ventas;
  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);
  const ticketPromedio = ventasFiltradas.length
    ? totalVentas / ventasFiltradas.length
    : 0;

  // Métricas adicionales
  const totalTickets = ventasFiltradas.length;
  const maxVenta = Math.max(...ventasFiltradas.map((v) => v.total), 0);
  const minVenta = Math.min(...ventasFiltradas.map((v) => v.total), 0);
  // Agrupar ventas por día
  const ventasPorDia: Record<string, number> = {};
  ventasFiltradas.forEach((v) => {
    const fecha = v.fecha.slice(0, 10);
    ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + v.total;
  });
  // Agrupar ventas por usuario
  const ventasPorUsuario: Record<string, number> = {};
  ventasFiltradas.forEach((v) => {
    const nombre =
      usuarios.find((u) => u.id === v.usuarioId)?.nombre || v.usuarioId;
    ventasPorUsuario[nombre] = (ventasPorUsuario[nombre] || 0) + v.total;
  });
  // Datos para gráficos
  const barData = {
    labels: Object.keys(ventasPorDia),
    datasets: [
      {
        label: "Ventas por día",
        data: Object.values(ventasPorDia),
        backgroundColor: "#2563eb",
      },
    ],
  };
  const pieData = {
    labels: Object.keys(ventasPorUsuario),
    datasets: [
      {
        label: "Ventas por usuario",
        data: Object.values(ventasPorUsuario),
        backgroundColor: [
          "#2563eb",
          "#22c55e",
          "#f59e42",
          "#ef4444",
          "#a21caf",
          "#eab308",
        ],
      },
    ],
  };

  // Chart.js ya tiene los datos preparados arriba (barData, pieData)

  const todayStr = new Date().toISOString().slice(0, 10);
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reporte {tipo}</h1>
      {tipo === "personalizado" && (
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
      )}
      <div className="flex gap-2 mb-4 items-center">
        <label>Usuario:</label>
        <select
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Todos</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-8 mb-4 flex-wrap">
        <div>
          <span className="font-bold">Ventas totales:</span> $
          {totalVentas.toFixed(2)}
        </div>
        <div>
          <span className="font-bold">Ticket promedio:</span> $
          {ticketPromedio.toFixed(2)}
        </div>
        <div>
          <span className="font-bold">Total tickets:</span> {totalTickets}
        </div>
        <div>
          <span className="font-bold">Venta máxima:</span> $
          {maxVenta.toFixed(2)}
        </div>
        <div>
          <span className="font-bold">Venta mínima:</span> $
          {minVenta.toFixed(2)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-bold mb-2">Ventas por día</h2>
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </div>
        {/*
        <div>
          <h2 className="font-bold mb-2">Ventas por usuario</h2>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
        */}
        {/* El gráfico Pie de Chart.js espera un array, no un objeto de configuración. Usar solo Recharts para evitar el error de tipo. */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Suspense
          fallback={<div className="text-center">Cargando gráficos...</div>}
        >
          <div>
            <h2 className="font-bold mb-2">Ventas por día (Chart.js)</h2>
            <Bar
              data={barData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          {Object.keys(ventasPorUsuario).length <= 12 && (
            <div>
              <h2 className="font-bold mb-2">Ventas por usuario (Chart.js)</h2>
              <Pie
                data={pieData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>
          )}
        </Suspense>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={async () => {
            if (ventasFiltradas.length === 0 || !!filtroError) return;
            setExportando("excel");
            setExportMsg("");
            try {
              await exportarVentasExcel(ventasFiltradas);
              setExportMsg("Exportación a Excel exitosa");
            } catch {
              setExportMsg("Error al exportar a Excel");
            } finally {
              setExportando(null);
              setTimeout(() => setExportMsg(""), 2500);
            }
          }}
          disabled={
            ventasFiltradas.length === 0 || !!filtroError || !!exportando
          }
          aria-busy={exportando === "excel"}
        >
          {exportando === "excel" && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar a Excel
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={async () => {
            if (ventasFiltradas.length === 0 || !!filtroError) return;
            setExportando("pdf");
            setExportMsg("");
            try {
              await exportarVentasPDF(ventasFiltradas);
              setExportMsg("Exportación a PDF exitosa");
            } catch {
              setExportMsg("Error al exportar a PDF");
            } finally {
              setExportando(null);
              setTimeout(() => setExportMsg(""), 2500);
            }
          }}
          disabled={
            ventasFiltradas.length === 0 || !!filtroError || !!exportando
          }
          aria-busy={exportando === "pdf"}
        >
          {exportando === "pdf" && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar a PDF
        </button>
      </div>
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
      {ventasLoading ? (
        <div className="text-center">Cargando...</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Fecha</th>
              <th className="p-2 border">Usuario</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((venta) => (
              <tr key={venta.id}>
                <td className="p-2 border text-center">{venta.id}</td>
                <td className="p-2 border">{venta.fecha.slice(0, 10)}</td>
                <td className="p-2 border">
                  {usuarios.find((u) => u.id === venta.usuarioId)?.nombre ||
                    venta.usuarioId}
                </td>
                <td className="p-2 border">${venta.total.toFixed(2)}</td>
              </tr>
            ))}
            {ventasFiltradas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No hay ventas en este periodo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
