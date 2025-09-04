"use client";
import React, { useState, useEffect } from "react";
import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";
import useSWR from "swr";
import { withRole } from "../components/withRole";
import { useSession } from "next-auth/react";

interface Producto {
  id: number;
  nombre: string;
  tamanio: string;
  precio: number;
}

function ProductosPage() {
  // UX states
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);
  const [mensaje, setMensaje] = useState<string>("");

  const handleExportarExcel = async () => {
    setExportando("excel");
    try {
      const rows = productos.map((p: Producto) => ({
        id: p.id,
        producto: p.nombre + (p.tamanio ? ` (${p.tamanio})` : ""),
        cantidad: 0,
        total: p.precio,
      }));
      await exportarVentasExcel(rows, "productos.xlsx");
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
      const rows = productos.map((p: Producto) => ({
        id: p.id,
        fecha: undefined,
        usuarioNombre: undefined,
        producto: p.nombre + (p.tamanio ? ` (${p.tamanio})` : ""),
        total: p.precio,
      }));
      await exportarVentasPDF(rows, "productos.pdf");
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
  const [productosUrl, setProductosUrl] = useState(() => {
    return sucursalId
      ? `/api/productos?sucursalId=${sucursalId}`
      : "/api/productos";
  });
  useEffect(() => {
    let url = sucursalId
      ? `/api/productos?sucursalId=${sucursalId}`
      : "/api/productos";
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (params.toString()) {
      url += (url.includes("?") ? "&" : "?") + params.toString();
    }
    setProductosUrl(url);
  }, [sucursalId, desde, hasta]);
  const {
    data: productos = [],
    error: productosError,
    isLoading: productosLoading,
    mutate: mutateProductos,
  } = useSWR<Producto[]>(productosUrl, (url: string) =>
    fetch(url).then((r) => r.json())
  );
  const [form, setForm] = useState<Partial<Producto>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Eliminar fetchProductos y useEffect asociados (SWR lo maneja)

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear o actualizar producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Validar y convertir precio a número
      const data = {
        ...form,
        precio: form.precio !== undefined ? Number(form.precio) : undefined,
      };
      const res = await fetch(
        editId ? `/api/productos/${editId}` : "/api/productos",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Error en la operación");
      setSuccess(editId ? "Producto actualizado" : "Producto creado");
      setForm({});
      setEditId(null);
      mutateProductos();
    } catch {
      setError("Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  // Editar producto
  const handleEdit = (producto: Producto) => {
    setForm(producto);
    setEditId(producto.id);
    setSuccess("");
    setError("");
  };

  // Eliminar producto
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSuccess("Producto eliminado");
      mutateProductos();
    } catch {
      setError("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Productos</h1>
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
          onClick={handleExportarExcel}
          disabled={productos.length === 0 || exportando === "excel"}
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
          disabled={productos.length === 0 || exportando === "pdf"}
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
      {mensaje && (
        <div className="mb-2 text-center font-semibold text-green-700 bg-green-100 border border-green-300 rounded p-2 animate-fade-in">
          {mensaje}
        </div>
      )}
      {productosLoading && (
        <div className="text-center py-4">Cargando productos...</div>
      )}
      {productosError && (
        <div className="text-red-600 mb-2">Error al cargar productos</div>
      )}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-2"
      >
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre || ""}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          name="tamanio"
          placeholder="Tamaño (ej: 9oz, 12oz, 1L)"
          value={form.tamanio || ""}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <input
          name="precio"
          type="number"
          step="0.01"
          min="0"
          placeholder="Precio"
          value={form.precio || ""}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {editId ? "Actualizar" : "Crear"}
        </button>
        {editId && (
          <button
            type="button"
            className="text-sm text-gray-500 underline"
            onClick={() => {
              setForm({});
              setEditId(null);
            }}
          >
            Cancelar edición
          </button>
        )}
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Tamaño</th>
              <th className="p-2 border">Precio</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td className="p-2 border text-center">{producto.id}</td>
                <td className="p-2 border">{producto.nombre}</td>
                <td className="p-2 border">{producto.tamanio}</td>
                <td className="p-2 border">${producto.precio?.toFixed(2)}</td>
                <td className="p-2 border flex gap-2 justify-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(producto)}
                  >
                    Editar
                  </button>
                  {session?.user?.rol === "admin" && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(producto.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay productos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withRole(ProductosPage, ["admin", "supervisor"]);
