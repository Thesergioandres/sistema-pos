interface Sucursal {
  id: number;
  nombre: string;
}
import React, { useEffect, useState } from "react";
import { exportarVentasExcel } from "../reportes/ExportarExcel";
import { exportarVentasPDF } from "../reportes/ExportarPDF";
import useSWR from "swr";
import { withRole } from "../components/withRole";

interface Usuario {
  id: number;
  email: string;
  password: string;
  nombre: string;
  rol: string;
  sucursalId?: number;
  sucursal?: { id: number; nombre: string };
}

import { useSession } from "next-auth/react";

function UsuariosPage() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [usuariosUrl, setUsuariosUrl] = useState(() => {
    return sucursalId
      ? `/api/usuarios?sucursalId=${sucursalId}`
      : "/api/usuarios";
  });
  useEffect(() => {
    let url = sucursalId
      ? `/api/usuarios?sucursalId=${sucursalId}`
      : "/api/usuarios";
    const params = new URLSearchParams();
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    if (params.toString()) {
      url += (url.includes("?") ? "&" : "?") + params.toString();
    }
    setUsuariosUrl(url);
  }, [sucursalId, desde, hasta]);
  const {
    data: usuarios = [],
    error: usuariosError,
    isLoading: usuariosLoading,
    mutate: mutateUsuarios,
  } = useSWR<Usuario[]>(usuariosUrl, (url: string) =>
    fetch(url).then((r) => r.json())
  );
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  useEffect(() => {
    // fetchUsuarios eliminado, SWR lo maneja
    // Cargar sucursales para el select
    fetch("/api/sucursales")
      .then((res) => res.json())
      .then((data) => setSucursales(data));
  }, []);
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
      const res = await fetch(
        editId ? `/api/usuarios/${editId}` : "/api/usuarios",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Error en la operación");
      setSuccess(editId ? "Usuario actualizado" : "Usuario creado");
      setForm({});
      setEditId(null);
      mutateUsuarios();
    } catch {
      setError("Error al guardar usuario");
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
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSuccess("Usuario eliminado");
      mutateUsuarios();
    } catch {
      setError("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
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
            const rows = usuarios.map((u) => ({
              id: u.id,
              producto: u.nombre,
              cantidad: 0,
              total: 0,
            }));
            exportarVentasExcel(rows, "usuarios.xlsx");
          }}
          disabled={usuarios.length === 0 || usuariosLoading}
          aria-busy={usuariosLoading}
        >
          {usuariosLoading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar Excel
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
          onClick={() => {
            const rows = usuarios.map((u) => ({
              id: u.id,
              fecha: undefined,
              usuarioNombre: u.nombre,
              email: u.email,
              rol: u.rol,
              sucursal: u.sucursal?.nombre || "",
            }));
            exportarVentasPDF(rows, "usuarios.pdf");
          }}
          disabled={usuarios.length === 0 || usuariosLoading}
          aria-busy={usuariosLoading}
        >
          {usuariosLoading && (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          Exportar PDF
        </button>
      </div>
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
        className="mb-6 bg-white dark:bg-zinc-900 p-4 rounded shadow flex flex-col gap-2"
        aria-label="Formulario de usuario"
      >
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
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Rol</th>
              <th className="p-2 border">Sucursal</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td className="p-2 border text-center">{usuario.id}</td>
                <td className="p-2 border">{usuario.email}</td>
                <td className="p-2 border">{usuario.nombre}</td>
                <td className="p-2 border">
                  <select
                    value={usuario.rol}
                    onChange={async (e) => {
                      const nuevoRol = e.target.value;
                      if (nuevoRol === usuario.rol) return;
                      setLoading(true);
                      setError("");
                      setSuccess("");
                      try {
                        const res = await fetch(`/api/usuarios/${usuario.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ rol: nuevoRol }),
                        });
                        if (!res.ok) throw new Error();
                        setSuccess("Rol actualizado");
                        mutateUsuarios();
                      } catch {
                        setError("Error al actualizar rol");
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
                <td className="p-2 border text-center">
                  <select
                    value={usuario.sucursalId || ""}
                    onChange={async (e) => {
                      const nuevaSucursalId = Number(e.target.value);
                      if (nuevaSucursalId === usuario.sucursalId) return;
                      setLoading(true);
                      setError("");
                      setSuccess("");
                      try {
                        const res = await fetch(`/api/usuarios/${usuario.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ sucursalId: nuevaSucursalId }),
                        });
                        if (!res.ok) throw new Error();
                        setSuccess("Sucursal actualizada");
                        mutateUsuarios();
                      } catch {
                        setError("Error al actualizar sucursal");
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
                <td className="p-2 border flex gap-2 justify-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(usuario)}
                  >
                    Editar
                  </button>
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
                        const res = await fetch(`/api/usuarios/${usuario.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ password: nueva }),
                        });
                        if (!res.ok) throw new Error();
                        setSuccess("Contraseña reseteada");
                      } catch {
                        setError("Error al resetear contraseña");
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
export default withRole(UsuariosPage, ["admin"]);
