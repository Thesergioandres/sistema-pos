"use client";
import React, { useState } from "react";
// ...existing code...
import dynamic from "next/dynamic";
import Spinner from "../components/Spinner";
const HistorialCliente = dynamic(() => import("./HistorialCliente"), {
  ssr: false,
  loading: () => (
    <div className="py-4 text-center">
      <Spinner label="Cargando historial" />
    </div>
  ),
});
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
const NotificacionesInteligentes = dynamic(
  () => import("./NotificacionesInteligentes"),
  {
    ssr: false,
    loading: () => (
      <div className="py-2 text-center">
        <Spinner label="Cargando sugerencias" />
      </div>
    ),
  }
);

interface ErroresCliente {
  nombre?: boolean;
  email?: boolean;
  telefono?: boolean;
  fechaNacimiento?: boolean;
}

interface Cliente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  notas?: string;
  creadoEn: string;
}

import { useSession } from "next-auth/react";
import { withPermission } from "../components/withPermission";
import { useToast } from "@/components/toast/ToastProvider";
function ClientesPage() {
  const { authFetch, swrFetcher } = useAuthFetch();
  const { show } = useToast();
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const clientesUrl = sucursalId
    ? `/api/clientes?sucursalId=${sucursalId}`
    : "/api/clientes";
  const { data: clientes = [], mutate } = useSWR<Cliente[]>(
    clientesUrl,
    (url: string) => swrFetcher(url)
  );
  const [errors, setErrors] = useState<ErroresCliente>({});
  // Validación de formulario
  const formValido = form.nombre && form.nombre.length >= 2;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: false });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!formValido) {
      setErrors({ ...errors, nombre: true });
      setError("Nombre requerido (mínimo 2 caracteres)");
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(
        editId ? `/api/clientes/${editId}` : "/api/clientes",
        {
          method: editId ? "PUT" : "POST",
          body: form,
        }
      );
      if (!res.ok) throw new Error();
      setSuccess(editId ? "Cliente actualizado" : "Cliente creado");
      show(editId ? "Cliente actualizado" : "Cliente creado", "success");
      setForm({});
      setEditId(null);
      mutate();
    } catch {
      setError("Error al guardar");
      show("Error al guardar", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(cliente: Cliente) {
    setForm(cliente);
    setEditId(cliente.id);
  }

  async function handleDelete(id: number) {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await authFetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSuccess("Cliente eliminado");
      show("Cliente eliminado", "success");
      mutate();
    } catch {
      setError("Error al eliminar");
      show("Error al eliminar", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <NotificacionesInteligentes />
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm flex flex-col gap-2"
        aria-label="Formulario de cliente"
      >
        <input
          name="nombre"
          placeholder="Nombre (mínimo 2 caracteres)"
          value={form.nombre || ""}
          onChange={handleChange}
          required
          minLength={2}
          className={`border p-2 rounded ${
            errors.nombre ? "border-red-500" : ""
          }`}
          aria-label="Nombre"
        />
        {errors.nombre && (
          <span className="text-red-500 text-xs">
            Nombre requerido (mínimo 2 caracteres)
          </span>
        )}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email || ""}
          onChange={handleChange}
          className={`border p-2 rounded ${
            errors.email ? "border-red-500" : ""
          }`}
          aria-label="Email"
        />
        {errors.email && (
          <span className="text-red-500 text-xs">Email inválido</span>
        )}
        <input
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono || ""}
          onChange={handleChange}
          className={`border p-2 rounded ${
            errors.telefono ? "border-red-500" : ""
          }`}
          aria-label="Teléfono"
        />
        {errors.telefono && (
          <span className="text-red-500 text-xs">Teléfono inválido</span>
        )}
        <input
          name="direccion"
          placeholder="Dirección"
          value={form.direccion || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="fechaNacimiento"
          type="date"
          placeholder="Fecha de nacimiento"
          value={form.fechaNacimiento ? form.fechaNacimiento.slice(0, 10) : ""}
          onChange={handleChange}
          className={`border p-2 rounded ${
            errors.fechaNacimiento ? "border-red-500" : ""
          }`}
          aria-label="Fecha de nacimiento"
        />
        {errors.fechaNacimiento && (
          <span className="text-red-500 text-xs">Fecha inválida</span>
        )}
        <textarea
          name="notas"
          placeholder="Notas"
          value={form.notas || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !formValido}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></span>
          )}
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
      {editId && <HistorialCliente clienteId={editId} />}
      <div className="table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr
                key={cliente.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <td className="text-center">{cliente.id}</td>
                <td className="break-anywhere">{cliente.nombre}</td>
                <td className="break-anywhere">{cliente.email}</td>
                <td className="break-anywhere">{cliente.telefono}</td>
                <td className="flex gap-2 justify-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(cliente)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(cliente.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay clientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withPermission(ClientesPage, ["clientes.gestion"]);
