"use client";
import React, { useState } from "react";
import useSWR from "swr";

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

export default function ComboFormPage() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const productosUrl = sucursalId
    ? `/api/productos?sucursalId=${sucursalId}`
    : "/api/productos";
  const { data: productos = [] } = useSWR<Producto[]>(
    productosUrl,
    (url: string) => fetch(url).then((r) => r.json())
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
      const res = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          precio: Number(form.precio),
          productos: form.productos.map((p) => ({
            ...p,
            productoId: Number(p.productoId),
            cantidad: Number(p.cantidad),
          })),
        }),
      });
      if (!res.ok) throw new Error("Error al crear combo");
      setSuccess("Combo creado correctamente");
      setForm({ nombre: "", precio: 0, productos: [] });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Crear Combo / Promoción</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="descripcion"
          value={form.descripcion || ""}
          onChange={handleChange}
          placeholder="Descripción"
          className="w-full border p-2 rounded"
        />
        <input
          name="precio"
          type="number"
          value={form.precio}
          onChange={handleChange}
          placeholder="Precio"
          className="w-full border p-2 rounded"
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
              className="bg-blue-500 text-white px-2 py-1 rounded"
            >
              Agregar
            </button>
          </div>
          {form.productos.map((cp, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <select
                value={cp.productoId}
                onChange={(e) =>
                  handleProductoChange(i, "productoId", e.target.value)
                }
                className="border p-1 rounded"
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
                className="border p-1 rounded w-20"
              />
              <button
                type="button"
                onClick={() => quitarProducto(i)}
                className="text-red-500"
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
          className="bg-green-600 text-white px-4 py-2 rounded"
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
