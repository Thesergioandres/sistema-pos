"use client";
import React, { useState, useEffect } from "react";
import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Producto = {
  id: number;
  nombre: string;
  tamanio: string;
  precio: number;
};

type ComboProducto = {
  id: number;
  producto: Producto;
  cantidad: number;
};

type Combo = {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  productos: ComboProducto[];
};

export default function CombosPage() {
  // Funciones dummy para edición y borrado (reemplazar por lógica real si es necesario)
  const handleEdit = (id: number) => {
    alert(`Editar combo ${id}`);
  };
  const handleDelete = (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este combo?")) {
      // Aquí iría la lógica real de borrado
      alert(`Combo ${id} eliminado (simulado)`);
    }
  };
  // UX states
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [mensaje, setMensaje] = useState<string>("");

  const handleExportarExcel = async () => {
    setExportando("excel");
    try {
      const rows = combos.map((combo: Combo) => ({
        id: combo.id,
        producto: combo.nombre,
        cantidad: combo.productos.reduce(
          (acc: number, cp: ComboProducto) => acc + cp.cantidad,
          0
        ),
        total: combo.precio,
      }));
      await exportarVentasExcel(rows, "combos.xlsx");
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
      const rows = combos.map((combo: Combo) => ({
        id: combo.id,
        fecha: undefined,
        usuarioNombre: undefined,
        producto: combo.nombre,
        total: combo.precio,
      }));
      await exportarVentasPDF(rows, "combos.pdf");
      setMensaje("Exportación a PDF exitosa");
    } catch {
      setMensaje("Error al exportar a PDF");
    } finally {
      setExportando(null);
      setTimeout(() => setMensaje(""), 2500);
    }
  };
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [combosUrl, setCombosUrl] = useState(() =>
    sucursalId ? `/api/combos?sucursalId=${sucursalId}` : "/api/combos"
  );

  useEffect(() => {
    setCombosUrl(
      sucursalId ? `/api/combos?sucursalId=${sucursalId}` : "/api/combos"
    );
  }, [sucursalId]);

  const { data: combos = [], mutate } = useSWR(
    combosUrl +
      (desde ? `&desde=${desde}` : "") +
      (hasta ? `&hasta=${hasta}` : ""),
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar combos");
      return res.json();
    },
    { refreshInterval: 0 }
  );

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Combos y Promociones</h1>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border p-2 rounded"
            aria-label="Filtrar desde fecha"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border p-2 rounded"
            aria-label="Filtrar hasta fecha"
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
            onClick={handleExportarExcel}
            disabled={combos.length === 0 || exportando === "excel"}
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
            disabled={combos.length === 0 || exportando === "pdf"}
            aria-busy={exportando === "pdf"}
          >
            {exportando === "pdf" && (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            )}
            Exportar PDF
          </button>
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
      </div>
      {mensaje && (
        <div className="mb-2 text-center font-semibold text-green-700 bg-green-100 border border-green-300 rounded p-2 animate-fade-in">
          {mensaje}
        </div>
      )}
      <div className="overflow-x-auto">
        {combos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay combos registrados para los filtros seleccionados.
          </div>
        ) : (
          <table className="min-w-full border" aria-label="Tabla de combos">
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Precio</th>
                <th className="p-2 border">Productos</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo: Combo) => (
                <tr
                  key={combo.id}
                  tabIndex={0}
                  className="hover:bg-blue-50 focus:bg-blue-100 transition-colors"
                >
                  <td className="p-2 border text-center">{combo.id}</td>
                  <td className="p-2 border">{combo.nombre}</td>
                  <td className="p-2 border">${combo.precio.toFixed(2)}</td>
                  <td className="p-2 border">
                    {combo.productos
                      .map(
                        (cp: ComboProducto) =>
                          `${cp.producto.nombre} (${cp.cantidad})`
                      )
                      .join(", ")}
                  </td>
                  <td className="p-2 border flex gap-2 justify-center">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleEdit(combo.id)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(combo.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
