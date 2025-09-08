"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

// Tipos locales
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

interface ComboForm {
  nombre: string;
  descripcion?: string;
  precio: number;
  productos: ComboProductoInput[];
  activo?: boolean;
}

import { useSession } from "next-auth/react";
import { withPermission } from "@/app/components/withPermission";

function ComboFormPage() {
  const { data: session } = useSession();
  const { swrFetcher, authFetch } = useAuthFetch();
  const { show } = useToast();
  const sucursalId = session?.user?.sucursalId;
  const productosUrl = sucursalId
    ? `/api/productos?sucursalId=${sucursalId}`
    : "/api/productos";
  const { data: productos = [] } = useSWR<Producto[]>(
    productosUrl,
    (url: string) => swrFetcher(url)
  );
  const [form, setForm] = useState<ComboForm>({
    nombre: "",
    precio: 0,
    productos: [],
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
      show("Error al crear combo", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4">Crear combo / promoción</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      >
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
  );
}

export default withPermission(ComboFormPage, ["catalogo.combos"]);
