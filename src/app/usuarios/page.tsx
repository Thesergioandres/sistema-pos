"use client";
interface Sucursal {
  id: number;
  nombre: string;
}
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { withRole } from "../components/withRole";
import { withPermission } from "../components/withPermission";

interface Usuario {
  id: number;
  email: string;
  password: string;
  nombre: string;
  rol: string;
  sucursalId?: number;
  sucursal?: { id: number; nombre: string };
  permisos?: Record<string, boolean>;
}

import { useSession } from "next-auth/react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

function UsuariosPage() {
  const { data: session } = useSession();
  const { swrFetcher, authFetch } = useAuthFetch();
  const { show } = useToast();
  const sucursalId = session?.user?.sucursalId;
  const [usuariosUrl, setUsuariosUrl] = useState(() => {
    return sucursalId
      ? `/api/usuarios?sucursalId=${sucursalId}`
      : "/api/usuarios";
  });
  useEffect(() => {
    const url = sucursalId
      ? `/api/usuarios?sucursalId=${sucursalId}`
      : "/api/usuarios";
    setUsuariosUrl(url);
  }, [sucursalId]);
  const {
    data: usuarios = [],
    error: usuariosError,
    isLoading: usuariosLoading,
    mutate: mutateUsuarios,
  } = useSWR<Usuario[]>(usuariosUrl, (url: string) => swrFetcher(url));
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  useEffect(() => {
    // fetchUsuarios eliminado, SWR lo maneja
    // Cargar sucursales para el select
    authFetch("/api/sucursales")
      .then((res) => res.json())
      .then((data) => setSucursales(data));
  }, [authFetch]);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [form, setForm] = useState<
    Partial<Usuario> & { confirmPassword?: string }
  >({});
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Validación avanzada
  const validate = () => {
    const nombreValido =
      form.nombre && /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]{2,50}$/.test(form.nombre);
    const emailValido =
      form.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email);
    const rolValido =
      form.rol && ["admin", "supervisor", "cajero"].includes(form.rol);
    // Contraseña segura: mínimo 8, mayúscula, minúscula, número, símbolo
    const passwordValida =
      editId ||
      (form.password &&
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
          form.password || ""
        ));
    // Confirmación de contraseña
    const confirmacionValida = editId || form.password === form.confirmPassword;
    return {
      nombre: !nombreValido,
      email: !emailValido,
      rol: !rolValido,
      password: !passwordValida,
      confirmPassword: !confirmacionValida,
    };
  };
  const errors = validate();
  const formValido =
    !errors.nombre &&
    !errors.email &&
    !errors.rol &&
    !errors.password &&
    !errors.confirmPassword;

  // Eliminar fetchUsuarios y useEffect asociados (SWR lo maneja)

  // Manejar cambios en el formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handlePermisoToggle = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permisos: { ...(prev.permisos || {}), [key]: !prev?.permisos?.[key] },
    }));
  };
  // Plantillas rápidas de permisos
  const templates: Record<string, Record<string, boolean>> = {
    ADMIN: {
      "ventas.registrar": true,
      "ventas.listado": true,
      "ventas.detalle": true,
      "ventas.pendientes": true,
      "ventas.pagos": true,
      "catalogo.productos": true,
      "catalogo.insumos": true,
      "catalogo.recetas": true,
      "catalogo.combos": true,
      "clientes.gestion": true,
      "reportes.ver": true,
      "sucursales.gestion": true,
      "usuarios.gestion": true,
      "notificaciones.enviar": true,
    },
    SUPERVISOR: {
      "ventas.listado": true,
      "ventas.detalle": true,
      "ventas.pagos": true,
      "catalogo.productos": true,
      "catalogo.insumos": true,
      "catalogo.recetas": true,
      "catalogo.combos": true,
      "reportes.ver": true,
    },
    VENTAS: {
      "ventas.registrar": true,
      "ventas.detalle": true,
      "ventas.pendientes": true,
      "ventas.listado": true,
      "ventas.pagos": true,
    },
    REPORTES: {
      "reportes.ver": true,
    },
  };
  async function applyTemplateToForm(t: keyof typeof templates) {
    const permisos = templates[t];
    setForm((prev) => ({ ...prev, permisos }));
  }
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Crear o actualizar usuario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch(
        editId ? `/api/usuarios/${editId}` : "/api/usuarios",
        {
          method: editId ? "PUT" : "POST",
          body: form,
        }
      );
      if (!res.ok) throw new Error("Error en la operación");
      setSuccess(editId ? "Usuario actualizado" : "Usuario creado");
      show(editId ? "Usuario actualizado" : "Usuario creado", "success");
      setForm({});
      setEditId(null);
      mutateUsuarios();
    } catch {
      setError("Error al guardar usuario");
      show("Error al guardar usuario", "error");
    } finally {
      setLoading(false);
    }
  };

  // Editar usuario
  const handleEdit = (usuario: Usuario) => {
    setForm({ ...usuario, password: "" }); // No mostrar password
    setEditId(usuario.id);
    setSuccess("");
    setError("");
  };

  // Eliminar usuario
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar usuario?")) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await authFetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSuccess("Usuario eliminado");
      show("Usuario eliminado", "success");
      mutateUsuarios();
    } catch {
      setError("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      {/* ...el resto del código permanece igual, sin filtros de fecha ni botones de exportación... */}
      {usuariosLoading && (
        <div className="text-center py-4">Cargando usuarios...</div>
      )}
      {usuariosError && (
        <div className="text-red-600 mb-2">Error al cargar usuarios</div>
      )}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <form
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm flex flex-col gap-2"
        aria-label="Formulario de usuario"
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-sm text-zinc-600">Plantillas:</span>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => applyTemplateToForm("ADMIN")}
          >
            Admin
          </button>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => applyTemplateToForm("SUPERVISOR")}
          >
            Supervisor
          </button>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => applyTemplateToForm("VENTAS")}
          >
            Ventas/Cajero
          </button>
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => applyTemplateToForm("REPORTES")}
          >
            Solo reportes
          </button>
        </div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={`border p-2 rounded ${
            touched.email && errors.email ? "border-red-500" : ""
          }`}
          aria-label="Correo electrónico"
          disabled={loading}
        />
        {touched.email && errors.email && (
          <span className="text-red-500 text-xs">Email inválido</span>
        )}
        <input
          name="password"
          placeholder="Contraseña"
          value={form.password || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required={!editId}
          className={`border p-2 rounded ${
            touched.password && errors.password ? "border-red-500" : ""
          }`}
          type="password"
        />
        {!editId && touched.password && errors.password && (
          <span className="text-red-500 text-xs">
            La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula,
            número y símbolo.
          </span>
        )}
        {!editId && (
          <input
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            value={form.confirmPassword || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className={`border p-2 rounded ${
              touched.confirmPassword && errors.confirmPassword
                ? "border-red-500"
                : ""
            }`}
            type="password"
          />
        )}
        {!editId && touched.confirmPassword && errors.confirmPassword && (
          <span className="text-red-500 text-xs">
            Las contraseñas no coinciden
          </span>
        )}
        <input
          name="nombre"
          placeholder="Nombre (2-50 letras)"
          value={form.nombre || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          minLength={2}
          maxLength={50}
          pattern="[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]{2,50}"
          className={`border p-2 rounded ${
            touched.nombre && errors.nombre ? "border-red-500" : ""
          }`}
        />
        {touched.nombre && errors.nombre && (
          <span className="text-red-500 text-xs">
            Nombre inválido (2-50 letras)
          </span>
        )}
        <select
          name="rol"
          value={form.rol || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className={`border p-2 rounded ${
            touched.rol && errors.rol ? "border-red-500" : ""
          }`}
        >
          <option value="">Selecciona rol</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="cajero">Cajero</option>
        </select>
        <select
          name="sucursalId"
          value={form.sucursalId || ""}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        >
          <option value="">Selecciona sucursal</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        <fieldset className="mt-2 border rounded p-2">
          <legend className="text-sm font-medium">Permisos</legend>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { key: "ventas.registrar", label: "Ventas - Registrar" },
              { key: "ventas.listado", label: "Ventas - Listado" },
              { key: "ventas.detalle", label: "Ventas - Detalle" },
              { key: "ventas.pendientes", label: "Ventas - Pendientes" },
              { key: "ventas.pagos", label: "Ventas - Registrar pagos" },
              { key: "catalogo.productos", label: "Catálogo - Productos" },
              { key: "catalogo.insumos", label: "Catálogo - Insumos" },
              { key: "catalogo.recetas", label: "Catálogo - Recetas" },
              { key: "catalogo.combos", label: "Catálogo - Combos" },
              { key: "clientes.gestion", label: "Clientes - Gestionar" },
              { key: "reportes.ver", label: "Reportes - Ver" },
              {
                key: "notificaciones.enviar",
                label: "Notificaciones - Enviar",
              },
              { key: "sucursales.gestion", label: "Sucursales - Gestionar" },
              { key: "usuarios.gestion", label: "Usuarios - Gestionar" },
            ].map((p) => (
              <label key={p.key} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.permisos?.[p.key])}
                  onChange={() => handlePermisoToggle(p.key)}
                />
                {p.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Sugerencia: para administradores, marca todos; para vendedores,
            marca las opciones de ventas necesarias.
          </p>
        </fieldset>
        {touched.rol && errors.rol && (
          <span className="text-red-500 text-xs">Selecciona un rol válido</span>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !formValido}
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
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Permisos</th>
              <th>Sucursal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <td className="text-center">{usuario.id}</td>
                <td className="break-anywhere">{usuario.email}</td>
                <td className="break-anywhere">{usuario.nombre}</td>
                <td>
                  <select
                    value={usuario.rol}
                    onChange={async (e) => {
                      const nuevoRol = e.target.value;
                      if (nuevoRol === usuario.rol) return;
                      setLoading(true);
                      setError("");
                      setSuccess("");
                      try {
                        const res = await authFetch(
                          `/api/usuarios/${usuario.id}`,
                          {
                            method: "PUT",
                            body: { rol: nuevoRol },
                          }
                        );
                        if (!res.ok) throw new Error();
                        setSuccess("Rol actualizado");
                        show("Rol actualizado", "success");
                        mutateUsuarios();
                      } catch {
                        setError("Error al actualizar rol");
                        show("Error al actualizar rol", "error");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="border p-1 rounded"
                  >
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="cajero">Cajero</option>
                  </select>
                </td>
                <td>
                  <div className="flex flex-col text-xs gap-1 max-w-[240px]">
                    {Object.entries(
                      usuario.permisos ||
                        ({
                          // Mostrar claves comunes si no hay permisos aún
                          "ventas.registrar": false,
                          "ventas.listado": false,
                          "ventas.detalle": false,
                          "ventas.pendientes": false,
                          "ventas.pagos": false,
                          "catalogo.productos": false,
                          "catalogo.insumos": false,
                          "catalogo.recetas": false,
                          "catalogo.combos": false,
                          "clientes.gestion": false,
                          "reportes.ver": false,
                          "notificaciones.enviar": false,
                          "sucursales.gestion": false,
                          "usuarios.gestion": false,
                        } as Record<string, boolean>)
                    ).map(([k, v]) => (
                      <label key={k} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(v)}
                          onChange={async () => {
                            setLoading(true);
                            setError("");
                            setSuccess("");
                            try {
                              const nuevos = {
                                ...(usuario.permisos || {}),
                                [k]: !v,
                              } as Record<string, boolean>;
                              const res = await authFetch(
                                `/api/usuarios/${usuario.id}`,
                                {
                                  method: "PUT",
                                  body: { permisos: nuevos },
                                }
                              );
                              if (!res.ok) throw new Error();
                              setSuccess("Permisos actualizados");
                              show("Permisos actualizados", "success");
                              mutateUsuarios();
                            } catch {
                              setError("Error al actualizar permisos");
                              show("Error al actualizar permisos", "error");
                            } finally {
                              setLoading(false);
                            }
                          }}
                        />
                        {k}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="text-center">
                  <select
                    value={usuario.sucursalId || ""}
                    onChange={async (e) => {
                      const nuevaSucursalId = Number(e.target.value);
                      if (nuevaSucursalId === usuario.sucursalId) return;
                      setLoading(true);
                      setError("");
                      setSuccess("");
                      try {
                        const res = await authFetch(
                          `/api/usuarios/${usuario.id}`,
                          {
                            method: "PUT",
                            body: { sucursalId: nuevaSucursalId },
                          }
                        );
                        if (!res.ok) throw new Error();
                        setSuccess("Sucursal actualizada");
                        show("Sucursal actualizada", "success");
                        mutateUsuarios();
                      } catch {
                        setError("Error al actualizar sucursal");
                        show("Error al actualizar sucursal", "error");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="border p-1 rounded"
                  >
                    <option value="">Sin sucursal</option>
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="flex gap-2 justify-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(usuario)}
                  >
                    Editar
                  </button>
                  <div className="relative group">
                    <button className="text-teal-700 hover:underline">
                      Aplicar plantilla
                    </button>
                    <div className="absolute z-10 hidden group-hover:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow p-2 text-xs">
                      {Object.keys(templates).map((t) => (
                        <button
                          key={t}
                          className="block text-left w-full hover:underline"
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const res = await authFetch(
                                `/api/usuarios/${usuario.id}`,
                                {
                                  method: "PUT",
                                  body: { permisos: templates[t] },
                                }
                              );
                              if (!res.ok) throw new Error();
                              show(`Plantilla ${t} aplicada`, "success");
                              mutateUsuarios();
                            } catch {
                              show("Error al aplicar plantilla", "error");
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="text-orange-600 hover:underline"
                    onClick={async () => {
                      const nueva = prompt(
                        "Nueva contraseña para " + usuario.email
                      );
                      if (!nueva) return;
                      // Expresión regular corregida (sin dobles escapes)
                      if (
                        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
                          nueva
                        )
                      ) {
                        alert(
                          "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
                        );
                        return;
                      }
                      setLoading(true);
                      setError("");
                      setSuccess("");
                      try {
                        const res = await authFetch(
                          `/api/usuarios/${usuario.id}`,
                          {
                            method: "PUT",
                            body: { password: nueva },
                          }
                        );
                        if (!res.ok) throw new Error();
                        setSuccess("Contraseña reseteada");
                        show("Contraseña reseteada", "success");
                      } catch {
                        setError("Error al resetear contraseña");
                        show("Error al resetear contraseña", "error");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Resetear contraseña
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(usuario.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default withPermission(withRole(UsuariosPage, ["admin"]), [
  "usuarios.gestion",
]);
