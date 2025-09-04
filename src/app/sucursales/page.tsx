"use client";
import React, { useState } from "react";
import useSWR from "swr";

interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
}

export default function SucursalesPage() {
  const { data: sucursales = [], mutate } = useSWR<Sucursal[]>(
    "/api/sucursales",
    (url: string) => fetch(url).then((r) => r.json())
  );
  const [form, setForm] = useState<Partial<Sucursal>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        editId ? `/api/sucursales/${editId}` : "/api/sucursales",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Error al guardar sucursal");
      setSuccess(editId ? "Sucursal actualizada" : "Sucursal creada");
      setForm({});
      setEditId(null);
      mutate();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s: Sucursal) => {
    setForm(s);
    setEditId(s.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar sucursal?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/sucursales/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setSuccess("Sucursal eliminada");
      mutate();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Sucursales</h2>
      <form onSubmit={handleSubmit} className="space-y-2 mb-6">
        <input
          name="nombre"
          value={form.nombre || ""}
          onChange={handleChange}
          placeholder="Nombre"
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="direccion"
          value={form.direccion || ""}
          onChange={handleChange}
          placeholder="Dirección"
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Guardando..." : editId ? "Actualizar" : "Crear"}
        </button>
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Dirección</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sucursales.map((s) => (
            <tr key={s.id}>
              <td className="p-2 border text-center">{s.id}</td>
              <td className="p-2 border">{s.nombre}</td>
              <td className="p-2 border">{s.direccion}</td>
              <td className="p-2 border flex gap-2">
                <button
                  onClick={() => handleEdit(s)}
                  className="bg-yellow-400 text-black px-2 py-1 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {sucursales.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No hay sucursales registradas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
