"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

// Tipos
interface Producto {
  id: number;
  nombre: string;
  tamanio: string;
  precio: number;
}

interface ComboProductoInput {
  productoId: number;
  cantidad: number;
}

interface ComboProducto {
  id: number;
  producto: Producto;
  cantidad: number;
}

interface Combo {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  productos: ComboProducto[];
}

interface ComboForm {
  nombre: string;
  descripcion?: string;
  precio: number;
  productos: ComboProductoInput[];
  activo?: boolean;
}

import { withPermission } from "../components/withPermission";

function CombosPage() {
  const { data: session } = useSession();
  const { swrFetcher, authFetch } = useAuthFetch();
  const { show } = useToast();
  const sucursalId = session?.user?.sucursalId;
  // URLs
  const combosUrl = sucursalId
    ? `/api/combos?sucursalId=${sucursalId}`
    : "/api/combos";
  const productosUrl = sucursalId
    ? `/api/productos?sucursalId=${sucursalId}`
    : "/api/productos";

  // SWR
  const { data: combos = [], mutate: mutateCombos } = useSWR<Combo[]>(
    combosUrl,
    (url: string) => swrFetcher(url)
  );
  const { data: productos = [] } = useSWR<Producto[]>(
    productosUrl,
    (url: string) => swrFetcher(url)
  );

  // Formulario
  const [form, setForm] = useState<ComboForm>({
    nombre: "",
    precio: 0,
    productos: [],
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Acciones de edición y borrado (dummy)
  const handleEdit = (id: number) => {
    alert(`Editar combo ${id}`);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este combo?")) return;
    try {
      const res = await authFetch(`/api/combos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar el combo");
      show("Combo eliminado", "success");
      mutateCombos();
    } catch (e) {
      show(e instanceof Error ? e.message : "Error al eliminar combo", "error");
    }
  };

  // Handlers de formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProductoChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const nuevos = [...form.productos];
    nuevos[index] = { ...nuevos[index], [field]: value };
    setForm({ ...form, productos: nuevos });
  };

  const agregarProducto = () => {
    setForm({
      ...form,
      productos: [
        ...form.productos,
        { productoId: productos[0]?.id || 0, cantidad: 1 },
      ],
    });
  };

  const quitarProducto = (index: number) => {
    const nuevos = [...form.productos];
    nuevos.splice(index, 1);
    setForm({ ...form, productos: nuevos });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch("/api/combos", {
        method: "POST",
        body: {
          ...form,
          precio: Number(form.precio),
          productos: form.productos.map((p) => ({
            ...p,
            productoId: Number(p.productoId),
            cantidad: Number(p.cantidad),
          })),
        },
      });
      if (!res.ok) throw new Error("Error al crear combo");
      setSuccess("Combo creado correctamente");
      show("Combo creado correctamente", "success");
      setForm({ nombre: "", precio: 0, productos: [] });
      mutateCombos();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
      show("Error al crear combo", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">Combos y promociones</h1>
        <div className="flex gap-2 items-center">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      </div>

      {/* Formulario de creación */}
      <div className="mx-auto p-4 mb-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm max-w-2xl">
        <h2 className="text-lg font-semibold mb-3">Crear combo / promoción</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            className="w-full border p-2 rounded bg-transparent"
            required
          />
          <textarea
            name="descripcion"
            value={form.descripcion || ""}
            onChange={handleChange}
            placeholder="Descripción"
            className="w-full border p-2 rounded bg-transparent"
          />
          <input
            name="precio"
            type="number"
            value={form.precio}
            onChange={handleChange}
            placeholder="Precio"
            className="w-full border p-2 rounded bg-transparent"
            required
            min={0}
            step={0.01}
          />
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Productos del combo</span>
              <button
                type="button"
                onClick={agregarProducto}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
              >
                Agregar
              </button>
            </div>
            {form.productos.map((cp, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-2 mb-2 items-center"
              >
                <select
                  value={cp.productoId}
                  onChange={(e) =>
                    handleProductoChange(i, "productoId", e.target.value)
                  }
                  className="border p-1 rounded bg-transparent"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={cp.cantidad}
                  onChange={(e) =>
                    handleProductoChange(i, "cantidad", e.target.value)
                  }
                  className="border p-1 rounded w-24 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => quitarProducto(i)}
                  className="text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo ?? true}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            <span>Activo</span>
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar Combo"}
          </button>
          {success && <div className="text-green-600">{success}</div>}
          {error && <div className="text-red-600">{error}</div>}
        </form>
      </div>

      {/* Listado de combos */}
      <div className="table-wrapper">
        {combos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay combos registrados para los filtros seleccionados.
          </div>
        ) : (
          <table className="table-base" aria-label="Tabla de combos">
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
                  <td className="p-2 border break-anywhere">{combo.nombre}</td>
                  <td className="p-2 border">${combo.precio.toFixed(2)}</td>
                  <td className="p-2 border break-anywhere">
                    {combo.productos
                      .map(
                        (cp: ComboProducto) =>
                          `${cp.producto.nombre} (${cp.cantidad})`
                      )
                      .join(", ")}
                  </td>
                  <td className="p-2 border">
                    <div className="flex flex-wrap gap-2 justify-center">
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
                    </div>
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

export default withPermission(CombosPage, ["catalogo.combos"]);
