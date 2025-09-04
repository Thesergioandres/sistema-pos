"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";

interface Receta {
  id: number;
  productoId: number;
  insumoId: number;
  cantidad: number;
}
interface Producto {
  id: number;
  nombre: string;
}
interface Insumo {
  id: number;
  nombre: string;
}

interface RecetaFormRow {
  insumoId: string;
  cantidad: string;
}

function RecetasPage() {
  const { data: session } = useSession();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [productoId, setProductoId] = useState<string>("");
  const [rows, setRows] = useState<RecetaFormRow[]>([
    { insumoId: "", cantidad: "" },
  ]);
  // const [editId, setEditId] = useState<number | null>(null); // Eliminado: no usado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(true);

  // Cargar recetas con filtro de sucursal activa
  // fetchRecetas ya redefinido abajo con fechas
  const fetchRecetas = async () => {
    setLoading(true);
    try {
      let url = "/api/recetas";
      const params = new URLSearchParams();
      const sucursalId = session?.user?.sucursalId;
      if (sucursalId) params.set("sucursalId", String(sucursalId));
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      if (Array.from(params).length > 0) {
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setRecetas(data);
    } catch {
      setError("Error al cargar recetas");
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos e insumos para selects con filtro de sucursal activa
  const fetchSelects = async () => {
    setLoadingSelects(true);
    try {
      const sucursalId = session?.user?.sucursalId;
      let prodUrl = "/api/productos";
      let insuUrl = "/api/insumos";
      if (sucursalId) {
        prodUrl += `?sucursalId=${sucursalId}`;
        insuUrl += `?sucursalId=${sucursalId}`;
      }
      const [prodRes, insuRes] = await Promise.all([
        fetch(prodUrl),
        fetch(insuUrl),
      ]);
      setProductos(await prodRes.json());
      setInsumos(await insuRes.json());
    } catch {
      setError("Error al cargar productos/insumos");
    } finally {
      setLoadingSelects(false);
    }
  };

  useEffect(() => {
    fetchRecetas();
    fetchSelects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.sucursalId]);
  useEffect(() => {
    fetchRecetas();
    fetchSelects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.sucursalId, desde, hasta]);

  // Manejar cambios en el formulario
  const handleRowChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const newRows = [...rows];
    newRows[idx][e.target.name as keyof RecetaFormRow] = e.target.value;
    setRows(newRows);
  };
  const handleAddRow = () => setRows([...rows, { insumoId: "", cantidad: "" }]);
  const handleRemoveRow = (idx: number) =>
    setRows(rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);

  // Validación simple
  const formValido =
    productoId &&
    rows.every((r) => r.insumoId && r.cantidad && !isNaN(Number(r.cantidad)));

  // Crear recetas (varias filas)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Enviar una receta por cada fila
      for (const row of rows) {
        await fetch("/api/recetas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productoId: Number(productoId),
            insumoId: Number(row.insumoId),
            cantidad: Number(row.cantidad),
          }),
        });
      }
      setSuccess("Recetas guardadas");
      setProductoId("");
      setRows([{ insumoId: "", cantidad: "" }]);
      fetchRecetas();
    } catch {
      setError("Error al guardar recetas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recetas</h1>
      <div className="flex gap-2 mb-4">
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
          onClick={() => {
            const rows = recetas.map((r) => ({
              id: r.id,
              producto: String(r.productoId),
              cantidad: r.cantidad,
              total: 0,
            }));
            exportarVentasExcel(rows, "recetas.xlsx");
          }}
          disabled={recetas.length === 0 || loading}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar Excel
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={() => {
            const rows = recetas.map((r) => ({
              id: r.id,
              fecha: "",
              usuarioNombre: String(r.productoId),
              total: r.cantidad,
            }));
            exportarVentasPDF(rows, "recetas.pdf");
          }}
          disabled={recetas.length === 0 || loading}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar PDF
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-2"
        aria-label="Formulario de receta"
      >
        <label className="text-sm">Producto</label>
        <select
          name="productoId"
          value={productoId}
          onChange={(e) => setProductoId(e.target.value)}
          required
          className="border p-2 rounded"
          disabled={loadingSelects}
        >
          <option value="">
            {loadingSelects
              ? "Cargando productos..."
              : "Selecciona un producto"}
          </option>
          {productos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <label className="text-sm mt-2">Insumos y cantidades</label>
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-1">
            <select
              name="insumoId"
              value={row.insumoId}
              onChange={(e) => handleRowChange(idx, e)}
              required
              className="border p-2 rounded"
              disabled={loadingSelects}
            >
              <option value="">
                {loadingSelects
                  ? "Cargando insumos..."
                  : "Selecciona un insumo"}
              </option>
              {insumos.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre}
                </option>
              ))}
            </select>
            <input
              name="cantidad"
              type="number"
              placeholder="Cantidad"
              value={row.cantidad}
              onChange={(e) => handleRowChange(idx, e)}
              required
              className="border p-2 rounded w-24"
            />
            <button
              type="button"
              className="text-red-600 text-lg px-2"
              onClick={() => handleRemoveRow(idx)}
              disabled={rows.length === 1}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-blue-600 underline text-sm w-fit"
          onClick={handleAddRow}
        >
          + Agregar insumo
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          disabled={loading || !formValido}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Guardar receta(s)
        </button>
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Producto</th>
              <th className="p-2 border">Insumo</th>
              <th className="p-2 border">Cantidad</th>
              {session?.user?.rol === "admin" && (
                <th className="p-2 border">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {recetas.map((receta) => (
              <tr key={receta.id}>
                <td className="p-2 border text-center">{receta.id}</td>
                <td className="p-2 border">
                  {productos.find((p) => p.id === receta.productoId)?.nombre ||
                    receta.productoId}
                </td>
                <td className="p-2 border">
                  {insumos.find((i) => i.id === receta.insumoId)?.nombre ||
                    receta.insumoId}
                </td>
                <td className="p-2 border">{receta.cantidad}</td>
                {session?.user?.rol === "admin" && (
                  <td className="p-2 border">
                    <button
                      className="text-red-600 hover:underline"
                      onClick={async () => {
                        if (!confirm("¿Eliminar receta?")) return;
                        setLoading(true);
                        setError("");
                        setSuccess("");
                        try {
                          const res = await fetch(`/api/recetas/${receta.id}`, {
                            method: "DELETE",
                          });
                          if (!res.ok) throw new Error();
                          setSuccess("Receta eliminada");
                          fetchRecetas();
                        } catch {
                          setError("Error al eliminar");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {recetas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No hay recetas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { withRole } from "../components/withRole";
export default withRole(RecetasPage, ["admin", "supervisor"]);
