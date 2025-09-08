"use client";
import React, { useState } from "react";
import { withRole } from "../components/withRole";
import { withPermission } from "../components/withPermission";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  isPrincipal?: boolean;
}

function SucursalesPage() {
  const { swrFetcher, authFetch } = useAuthFetch();
  const { show } = useToast();
  const { data: sucursales = [], mutate } = useSWR<Sucursal[]>(
    "/api/sucursales",
    (url: string) => swrFetcher(url)
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
      // Intentar enviar negocioId si está persistido (Sidebar lo guarda)
      const persistedNegocioId =
        typeof window !== "undefined"
          ? localStorage.getItem("negocioId")
          : null;
      const parsedNegocioId =
        persistedNegocioId !== null ? Number(persistedNegocioId) : undefined;
      const body: Record<string, unknown> = {
        ...form,
        ...(typeof parsedNegocioId === "number" &&
        !Number.isNaN(parsedNegocioId)
          ? { negocioId: parsedNegocioId }
          : {}),
      };
      const res = await authFetch(
        editId ? `/api/sucursales/${editId}` : "/api/sucursales",
        {
          method: editId ? "PUT" : "POST",
          body,
        }
      );
      if (!res.ok) {
        let msg = "Error al guardar sucursal";
        try {
          const j = await res.json();
          if (j && typeof j.error === "string") msg = j.error;
        } catch {}
        throw new Error(msg);
      }
      setSuccess(editId ? "Sucursal actualizada" : "Sucursal creada");
      show(editId ? "Sucursal actualizada" : "Sucursal creada", "success");
      setForm({});
      setEditId(null);
      mutate();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
      show("Error al guardar sucursal", "error");
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
      const res = await authFetch(`/api/sucursales/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setSuccess("Sucursal eliminada");
      show("Sucursal eliminada", "success");
      mutate();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Error desconocido");
      show("Error al eliminar sucursal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold">Sucursales</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm space-y-2"
      >
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Guardando..." : editId ? "Actualizar" : "Crear"}
        </button>
        {success && <div className="text-green-600">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </form>
      <div className="table-wrapper">
        <table className="table-base">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.map((s) => (
              <tr
                key={s.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <td className="text-center">{s.id}</td>
                <td className="break-anywhere">
                  {s.nombre}
                  {s.isPrincipal && (
                    <span className="ml-2 inline-block text-xs rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 align-middle">
                      Principal
                    </span>
                  )}
                </td>
                <td className="break-anywhere">{s.direccion}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(s)}
                      className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const res = await authFetch(
                            `/api/sucursales/${s.id}/principal`,
                            { method: "POST" }
                          );
                          if (!res.ok)
                            throw new Error("No se pudo marcar como principal");
                          show("Sucursal marcada como principal", "success");
                          await mutate();
                        } catch {
                          show("Error al marcar como principal", "error");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      Hacer principal
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Eliminar
                    </button>
                  </div>
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
    </div>
  );
}

export default withPermission(withRole(SucursalesPage, ["admin"]), [
  "sucursales.gestion",
]);
