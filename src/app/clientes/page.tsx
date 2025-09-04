"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const HistorialCliente = dynamic(() => import("./HistorialCliente"), {
  ssr: false,
});
import useSWR from "swr";
import NotificacionesInteligentes from "./NotificacionesInteligentes";
import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";

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
export default function ClientesPage() {
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Validación avanzada de campos
  // ...los useState ya están declarados arriba...
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  // Validar rango de fechas antes de exportar (debe ir después de los useState de desde y hasta)
  const rangoFechasValido =
    (!desde && !hasta) ||
    (desde &&
      hasta &&
      desde <= hasta &&
      desde.length === 10 &&
      hasta.length === 10);
  const [clientesUrl, setClientesUrl] = useState(() => {
    return sucursalId
      ? `/api/clientes?sucursalId=${sucursalId}`
      : "/api/clientes";
  });
  // Validación avanzada de campos
  const validate = () => {
    const nombreValido = form.nombre && form.nombre.length >= 2;
    const emailValido =
      !form.email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);
    const telefonoValido =
      !form.telefono || /^\+?[0-9\- ]{7,20}$/.test(form.telefono);
    const fechaValida =
      !form.fechaNacimiento || /^\d{4}-\d{2}-\d{2}$/.test(form.fechaNacimiento);
    return {
      nombre: !nombreValido,
      email: !emailValido,
      telefono: !telefonoValido,
      fechaNacimiento: !fechaValida,
    };
  };
  const errors = validate();
  const formValido =
    !errors.nombre &&
    !errors.email &&
    !errors.telefono &&
    !errors.fechaNacimiento;
  useEffect(() => {
    let url = sucursalId
      ? `/api/clientes?sucursalId=${sucursalId}`
      : "/api/clientes";
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (params.toString()) {
      url += (url.includes("?") ? "&" : "?") + params.toString();
    }
    setClientesUrl(url);
  }, [sucursalId, desde, hasta]);
  const { data: clientes = [], mutate } = useSWR<Cliente[]>(
    clientesUrl,
    (url: string) => fetch(url).then((r) => r.json())
  );
  // Eliminado: duplicado de useState

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(
        editId ? `/api/clientes/${editId}` : "/api/clientes",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error();
      setSuccess(editId ? "Cliente actualizado" : "Cliente creado");
      setForm({});
      setEditId(null);
      mutate();
    } catch {
      setError("Error al guardar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setForm(cliente);
    setEditId(cliente.id);
    setSuccess("");
    setError("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSuccess("Cliente eliminado");
      mutate();
    } catch {
      setError("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
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
          onClick={async () => {
            setError("");
            setSuccess("");
            if (!rangoFechasValido) {
              setError("Rango de fechas inválido");
              return;
            }
            try {
              setLoading(true);
              const rows = clientes.map((c) => ({
                id: c.id,
                producto: c.nombre,
                cantidad: 0,
                total: 0,
              }));
              await exportarVentasExcel(rows, "clientes.xlsx");
              setSuccess("Exportación a Excel exitosa");
            } catch {
              setError("Error al exportar a Excel");
            } finally {
              setLoading(false);
              setTimeout(() => setSuccess(""), 2500);
            }
          }}
          disabled={clientes.length === 0 || loading || !rangoFechasValido}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar Excel
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={async () => {
            setError("");
            setSuccess("");
            if (!rangoFechasValido) {
              setError("Rango de fechas inválido");
              return;
            }
            try {
              setLoading(true);
              const rows = clientes.map((c) => ({
                id: c.id,
                fecha: c.creadoEn,
                usuarioNombre: c.nombre,
                total: 0,
              }));
              await exportarVentasPDF(rows, "clientes.pdf");
              setSuccess("Exportación a PDF exitosa");
            } catch {
              setError("Error al exportar a PDF");
            } finally {
              setLoading(false);
              setTimeout(() => setSuccess(""), 2500);
            }
          }}
          disabled={clientes.length === 0 || loading || !rangoFechasValido}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar PDF
        </button>
        {!rangoFechasValido && (
          <span className="text-red-500 text-xs">Rango de fechas inválido</span>
        )}
      </div>
      <NotificacionesInteligentes />
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-2"
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
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Teléfono</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td className="p-2 border text-center">{cliente.id}</td>
                <td className="p-2 border">{cliente.nombre}</td>
                <td className="p-2 border">{cliente.email}</td>
                <td className="p-2 border">{cliente.telefono}</td>
                <td className="p-2 border flex gap-2 justify-center">
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
