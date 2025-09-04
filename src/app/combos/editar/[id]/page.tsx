"use client";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

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

export default function EditarComboPage() {
  const params = useParams();
  const router = useRouter();
  const comboId = Number(params?.id);
  // Obtener sucursal activa de la sesión
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const productosUrl = sucursalId
    ? `/api/productos?sucursalId=${sucursalId}`
    : "/api/productos";
  const { data: productos = [] } = useSWR<Producto[]>(
    productosUrl,
    (url: string) => fetch(url).then((r) => r.json())
  );
  const { data: combo, isLoading } = useSWR<
    ComboForm & { productos: { productoId: number; cantidad: number }[] }
  >(comboId ? `/api/combos/${comboId}` : null, (url: string) =>
    fetch(url).then((r) => r.json())
  );
  const [form, setForm] = useState<ComboForm>({
    nombre: "",
    precio: 0,
    productos: [],
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (combo) {
      setForm({
        nombre: combo.nombre,
        descripcion: combo.descripcion,
        precio: combo.precio,
        productos: combo.productos.map((p) => {
          if ("productoId" in p && typeof p.productoId !== "undefined") {
            return { productoId: p.productoId, cantidad: p.cantidad };
          } else if (
            "producto" in p &&
            p.producto &&
            typeof (p.producto as { id?: number }).id === "number"
          ) {
            return {
              productoId: (p.producto as { id: number }).id,
              cantidad: p.cantidad,
            };
          } else {
            return { productoId: 0, cantidad: p.cantidad };
          }
        }),
        activo: combo.activo,
      });
    }
  }, [combo]);

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
      const res = await fetch(`/api/combos/${comboId}`, {
        method: "PUT",
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
      if (!res.ok) throw new Error("Error al actualizar combo");
      setSuccess("Combo actualizado correctamente");
      setTimeout(() => router.push("/combos"), 1000);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div>Cargando combo...</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Editar Combo / Promoción</h2>
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
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}
