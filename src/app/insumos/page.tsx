"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { withRole } from "@/app/components/withRole";
import { withPermission } from "@/app/components/withPermission";
import { useAuthFetch } from "@/lib/useAuthFetch";

// Tipos
interface Insumo {
  id: number;
  nombre: string;
  stock: number;
  unidad: string;
  stockMinimo?: number | null;
  proveedor?: string | null;
  sucursalId?: number | null;
}

const initialForm: Partial<Insumo> = {
  nombre: "",
  stock: 0,
  unidad: "",
  stockMinimo: undefined,
  proveedor: "",
};

function InsumosPage() {
  const { data: session } = useSession();
  const { authFetch } = useAuthFetch();

  // state
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [form, setForm] = useState<Partial<Insumo>>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const sucursalId = useMemo(() => {
    const id = session?.user?.sucursalId;
    if (id === undefined || id === null) return undefined;
    const n = Number(id);
    return Number.isNaN(n) ? undefined : n;
  }, [session]);

  // helpers
  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  const fetchInsumos = async () => {
    try {
      setLoading(true);
      resetFeedback();
      const params = new URLSearchParams();
      if (sucursalId !== undefined)
        params.set("sucursalId", String(sucursalId));
      const url = params.toString()
        ? `/api/insumos?${params.toString()}`
        : "/api/insumos";
      const res = await authFetch(url);
      if (!res.ok) throw new Error("No se pudo obtener la lista de insumos");
      const data = await res.json();
      setInsumos(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalId]);

  // form handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "stock" || name === "stockMinimo" ? Number(value) : value,
    }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validate = (f: Partial<Insumo>) => {
    const nombreOk = !!f.nombre && f.nombre.trim().length >= 2;
    const stockOk = typeof f.stock === "number" && f.stock >= 0;
    const unidadOk = !!f.unidad && f.unidad.trim().length > 0;
    const stockMinimoOk =
      f.stockMinimo === undefined ||
      f.stockMinimo === null ||
      f.stockMinimo >= 0;

    return {
      nombre: nombreOk,
      stock: stockOk,
      unidad: unidadOk,
      stockMinimo: stockMinimoOk,
    } as const;
  };

  const errors = useMemo(() => validate(form), [form]);
  const formValido =
    errors.nombre && errors.stock && errors.unidad && errors.stockMinimo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();

    if (!formValido) {
      setError("Por favor, corrige los errores del formulario.");
      return;
    }

    try {
      setLoading(true);
      const payload: {
        nombre: string | undefined;
        stock: number;
        unidad: string | undefined;
        stockMinimo: number;
        proveedor: string | null;
      } = {
        nombre: form.nombre?.toString().trim(),
        stock: Number(form.stock ?? 0),
        unidad: form.unidad?.toString().trim(),
        stockMinimo: Number(
          form.stockMinimo === undefined || form.stockMinimo === null
            ? 0
            : form.stockMinimo
        ),
        proveedor:
          form.proveedor && form.proveedor.toString().trim().length > 0
            ? form.proveedor.toString().trim()
            : null,
      };

      const res = await authFetch(
        editId ? `/api/insumos/${editId}` : "/api/insumos",
        {
          method: editId ? "PUT" : "POST",
          body: payload,
        }
      );
      if (!res.ok) throw new Error("No se pudo guardar el insumo");

      setSuccess(editId ? "Insumo actualizado" : "Insumo creado");
      setForm(initialForm);
      setTouched({});
      setEditId(null);
      await fetchInsumos();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (insumo: Insumo) => {
    resetFeedback();
    setEditId(insumo.id);
    setForm({
      nombre: insumo.nombre,
      stock: insumo.stock,
      unidad: insumo.unidad,
      stockMinimo: insumo.stockMinimo ?? undefined,
      proveedor: insumo.proveedor ?? "",
    });
    setTouched({});
  };

  const handleDelete = async (id: number) => {
    if (!id) return;
    resetFeedback();
    try {
      setLoading(true);
      const res = await authFetch(`/api/insumos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar el insumo");
      setSuccess("Insumo eliminado");
      await fetchInsumos();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Insumos</h1>

      {error && (
        <div className="rounded border border-red-300 bg-black p-3 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-green-300 bg-black p-3 text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              value={form.nombre ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 w-full rounded border p-2"
              placeholder="Ej: Botella 1L"
            />
            {touched.nombre && !errors.nombre && (
              <p className="text-xs text-red-600 mt-1">
                Ingresa al menos 2 caracteres.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Stock</label>
            <input
              type="number"
              min={0}
              name="stock"
              value={form.stock ?? 0}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 w-full rounded border p-2"
            />
            {touched.stock && !errors.stock && (
              <p className="text-xs text-red-600 mt-1">
                Debe ser un número mayor o igual a 0.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Unidad</label>
            <input
              name="unidad"
              value={form.unidad ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 w-full rounded border p-2"
              placeholder="Ej: unidades, litros, kg"
            />
            {touched.unidad && !errors.unidad && (
              <p className="text-xs text-red-600 mt-1">
                La unidad es obligatoria.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Stock mínimo</label>
            <input
              type="number"
              min={0}
              name="stockMinimo"
              value={form.stockMinimo ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 w-full rounded border p-2"
              placeholder="Opcional"
            />
            {touched.stockMinimo && !errors.stockMinimo && (
              <p className="text-xs text-red-600 mt-1">
                Debe ser un número mayor o igual a 0.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Proveedor</label>
            <input
              name="proveedor"
              value={form.proveedor ?? ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className="mt-1 w-full rounded border p-2"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!formValido || loading}
            className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          >
            {editId ? "Actualizar" : "Crear"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm(initialForm);
                setTouched({});
              }}
              className="rounded border px-4 py-2"
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 font-medium">
          Listado
        </div>
        <div className="table-wrapper">
          <table className="table-base">
            <thead>
              <tr>
                <th className="text-left">Nombre</th>
                <th className="text-left">Stock</th>
                <th className="text-left">Unidad</th>
                <th className="text-left">Stock mínimo</th>
                <th className="text-left">Proveedor</th>
                <th className="text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-4 text-gray-500">
                    {loading ? "Cargando..." : "Sin registros"}
                  </td>
                </tr>
              )}
              {insumos.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="break-anywhere">{i.nombre}</td>
                  <td>{i.stock}</td>
                  <td>{i.unidad}</td>
                  <td>{i.stockMinimo ?? "-"}</td>
                  <td className="break-anywhere">{i.proveedor ?? "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => handleEdit(i)}
                      >
                        Editar
                      </button>
                      <button
                        className="px-2 py-1 rounded border text-red-600 border-red-300"
                        onClick={() => handleDelete(i.id)}
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withPermission(withRole(InsumosPage, ["admin", "supervisor"]), [
  "catalogo.insumos",
]);
