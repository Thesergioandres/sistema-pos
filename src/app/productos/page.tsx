"use client";
import React, { useState } from "react";

import useSWR from "swr";
import { authFetch } from "@/lib/http";
import { withRole } from "../components/withRole";
import { withPermission } from "../components/withPermission";
import { useSession } from "next-auth/react";

interface Producto {
  id: number;
  nombre: string;
  tamanio: string;
  precio: number;
}

function ProductosPage() {
  // UX states
  // ...existing code...
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  // Si no hay sucursal activa, como fallback permitir filtrar por negocio desde localStorage
  let productosUrl = "/api/productos";
  if (sucursalId) {
    productosUrl = `/api/productos?sucursalId=${sucursalId}`;
  } else if (typeof window !== "undefined") {
    const negocioId = localStorage.getItem("negocioId");
    if (negocioId) productosUrl = `/api/productos?negocioId=${negocioId}`;
  }
  const { data: productos = [], mutate: mutateProductos } = useSWR<Producto[]>(
    productosUrl,
    (url: string) => authFetch(url).then((r) => r.json())
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
      const res = await authFetch(
        editId ? `/api/productos/${editId}` : "/api/productos",
        {
          method: editId ? "PUT" : "POST",
          body: data,
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
      const res = await authFetch(`/api/productos/${id}`, { method: "DELETE" });
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
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Productos</h1>
      {/* Filtros y acciones eliminados */}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm flex flex-col gap-2"
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
      <div className="table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Tamaño</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr
                key={producto.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <td className="text-center">{producto.id}</td>
                <td className="break-anywhere">{producto.nombre}</td>
                <td>{producto.tamanio}</td>
                <td>${producto.precio?.toFixed(2)}</td>
                <td className="flex gap-2 justify-center">
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

export default withPermission(
  withRole(ProductosPage, ["admin", "supervisor"]),
  ["catalogo.productos"]
);
