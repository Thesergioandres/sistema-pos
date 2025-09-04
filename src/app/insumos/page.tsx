"use client";

import React, { useEffect, useState } from "react";
import { withRole } from "../components/withRole";
import { useSession } from "next-auth/react";
import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";

interface Insumo {
  id: number;
  nombre: string;
  stock: number;
  unidad: string;
  proveedor?: string;
}

function InsumosPage() {
  const { data: session } = useSession();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [form, setForm] = useState<Partial<Insumo>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});

  // Cargar insumos con filtro de sucursal activa

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      let url = "/api/insumos";
      const params = new URLSearchParams();
      const sucursalId = session?.user?.sucursalId;
      if (sucursalId) params.set("sucursalId", String(sucursalId));
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
      if (Array.from(params).length > 0) {
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setInsumos(data);
    } catch {
      setError("Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.sucursalId, desde, hasta]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Validación avanzada
  const validate = () => {
    const nombreValido =
      form.nombre && /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 .,'-]{2,50}$/.test(form.nombre);
    const stockValido =
      form.stock !== undefined &&
      !isNaN(Number(form.stock)) &&
      Number(form.stock) >= 0 &&
      Number(form.stock) <= 100000;
    const unidadValida =
      form.unidad && /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]{1,10}$/.test(form.unidad);
    return {
      nombre: !nombreValido,
      stock: !stockValido,
      unidad: !unidadValida,
    };
  };
  const errors = validate();
  const formValido = !errors.nombre && !errors.stock && !errors.unidad;

  // Crear o actualizar insumo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nombre: true, stock: true, unidad: true });
    if (!formValido) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(
        editId ? `/api/insumos/${editId}` : "/api/insumos",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Error en la operación");
      setSuccess(editId ? "Insumo actualizado" : "Insumo creado");
      setForm({});
      setEditId(null);
      setTouched({});
      fetchInsumos();
    } catch {
      setError("Error al guardar insumo");
    } finally {
      setLoading(false);
    }
  };

  // Editar insumo
  const handleEdit = (insumo: Insumo) => {
    setForm(insumo);
    setEditId(insumo.id);
    setSuccess("");
    setError("");
    setTouched({});
  };

  // Eliminar insumo
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar insumo?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/insumos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSuccess("Insumo eliminado");
      fetchInsumos();
    } catch {
      setError("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Insumos</h1>
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
          onClick={() => {
            const rows = insumos.map((i) => ({
              id: i.id,
              producto: i.nombre,
              cantidad: i.stock,
              total: 0,
            }));
            exportarVentasExcel(rows, "insumos.xlsx");
          }}
          disabled={insumos.length === 0 || loading}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar Excel
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={() => {
            const rows = insumos.map((i) => ({
              id: i.id,
              fecha: "",
              usuarioNombre: i.proveedor || "",
              total: i.stock,
            }));
            exportarVentasPDF(rows, "insumos.pdf");
          }}
          disabled={insumos.length === 0 || loading}
          aria-busy={loading}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar PDF
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-2"
        aria-label="Formulario de insumo"
      >
        <input
          name="nombre"
          placeholder="Nombre (2-50 letras/números)"
          value={form.nombre || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          minLength={2}
          maxLength={50}
          pattern="[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 .,'-]{2,50}"
          className={`border p-2 rounded ${
            touched.nombre && errors.nombre ? "border-red-500" : ""
          }`}
        />
        {touched.nombre && errors.nombre && (
          <span className="text-red-500 text-xs">
            Nombre inválido (2-50 letras/números)
          </span>
        )}
        <input
          name="stock"
          type="number"
          placeholder="Stock (0-100000)"
          value={form.stock ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          min={0}
          max={100000}
          className={`border p-2 rounded ${
            touched.stock && errors.stock ? "border-red-500" : ""
          }`}
        />
        {touched.stock && errors.stock && (
          <span className="text-red-500 text-xs">
            Stock inválido (0-100000)
          </span>
        )}
        <input
          name="unidad"
          placeholder="Unidad (ej: kg, l, pza)"
          value={form.unidad || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          minLength={1}
          maxLength={10}
          pattern="[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]{1,10}"
          className={`border p-2 rounded ${
            touched.unidad && errors.unidad ? "border-red-500" : ""
          }`}
        />
        {touched.unidad && errors.unidad && (
          <span className="text-red-500 text-xs">
            Unidad inválida (solo letras, 1-10)
          </span>
        )}
        <input
          name="proveedor"
          placeholder="Proveedor (opcional)"
          value={form.proveedor || ""}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          disabled={loading || !formValido}
        >
          {loading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
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
              setTouched({});
            }}
          >
            Cancelar edición
          </button>
        )}
      </form>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading && (
        <div className="flex items-center gap-2 text-blue-600">
          <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
          Cargando...
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Stock</th>
              <th className="p-2 border">Unidad</th>
              <th className="p-2 border">Proveedor</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td className="p-2 border text-center">{insumo.id}</td>
                <td className="p-2 border">{insumo.nombre}</td>
                <td className="p-2 border text-right">{insumo.stock}</td>
                <td className="p-2 border">{insumo.unidad}</td>
                <td className="p-2 border">{insumo.proveedor || "-"}</td>
                <td className="p-2 border flex gap-2 justify-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(insumo)}
                  >
                    Editar
                  </button>
                  {session?.user?.rol === "admin" && (
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(insumo.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {insumos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No hay insumos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withRole(InsumosPage, ["admin", "supervisor"]);
