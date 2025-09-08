"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useToast } from "@/components/toast/ToastProvider";
import { authFetch } from "@/lib/http";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { show } = useToast();
  const router = useRouter();
  const { status, data: session, update } = useSession();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  // Campos de negocio y sucursal
  const [negocioNombre, setNegocioNombre] = useState("");
  const [negocioDescripcion, setNegocioDescripcion] = useState("");
  const [sucursalNombre, setSucursalNombre] = useState("");
  const [sucursalDireccion, setSucursalDireccion] = useState("");

  // Si ya estás autenticado, no tiene sentido mostrar registro
  useEffect(() => {
    // Redirigir solo si realmente hay usuario válido
    const userId = session?.user?.id;
    const sucursalId = session?.user?.sucursalId;
    if (status === "authenticated") {
      if (
        typeof userId === "number" &&
        userId > 0 &&
        typeof sucursalId === "number" &&
        sucursalId > 0
      ) {
        router.replace("/ventas");
      }
      // Si no tiene sucursal asignada aún, permanecer en registro para completar negocio/sucursal
    }
  }, [status, session, router]);

  const validatePassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]:;"'<>,.?/]).{8,}$/.test(
      pwd
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validatePassword(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!negocioNombre.trim() || !sucursalNombre.trim()) {
      setError("El nombre del negocio y el de la sucursal son obligatorios");
      return;
    }
    setLoading(true);
    const res = await authFetch("/api/usuarios", {
      method: "POST",
      body: { nombre, email, password },
    });
    setLoading(false);
    if (res.ok) {
      show("Usuario registrado", "success");
      // Iniciar sesión automáticamente
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (loginRes?.error) {
        setSuccess(
          "Usuario registrado, pero hubo un error al iniciar sesión. Inicia sesión manualmente."
        );
        show("Registrado, inicia sesión manualmente", "info");
      } else {
        // Crear negocio, sucursal y asignarla al usuario actual
        try {
          // 1) Crear negocio
          const resNeg = await authFetch("/api/negocios", {
            method: "POST",
            body: {
              nombre: negocioNombre.trim(),
              descripcion: negocioDescripcion || null,
            },
          });
          if (!resNeg.ok) {
            const msg = (await resNeg.json().catch(() => null))?.error;
            throw new Error(msg || "Error al crear negocio");
          }
          const negocio = await resNeg.json();
          const negocioId = negocio?.id as number | undefined;
          if (typeof window !== "undefined" && negocioId) {
            try {
              localStorage.setItem("negocioId", String(negocioId));
            } catch {}
          }

          // 2) Crear sucursal principal
          const resSuc = await authFetch("/api/sucursales", {
            method: "POST",
            body: {
              nombre: sucursalNombre.trim(),
              direccion: sucursalDireccion || null,
              negocioId,
            },
          });
          if (!resSuc.ok) {
            const msg = (await resSuc.json().catch(() => null))?.error;
            throw new Error(msg || "Error al crear sucursal");
          }
          const suc = await resSuc.json();

          // 3) Asignar la sucursal al usuario actual
          const resAsign = await authFetch("/api/usuarios/cambiar-sucursal", {
            method: "POST",
            body: { sucursalId: suc.id },
          });
          if (!resAsign.ok) {
            const msg = (await resAsign.json().catch(() => null))?.error;
            throw new Error(msg || "Error al asignar sucursal al usuario");
          }
          // Refrescar sesión para traer sucursalId y permisos actualizados
          await update();
          show("¡Listo! Negocio y sucursal creados", "success");
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("app:navigation", { detail: { href: "/ventas" } })
            );
          }
          router.replace("/ventas");
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
          show(msg, "error");
        }
      }
    } else {
      let data = null;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }
      setError(data?.error || "Error al registrar usuario");
      show(data?.error || "Error al registrar usuario", "error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-800 p-8 rounded shadow w-full max-w-md flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold mb-2">Registro</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 -mt-2">
          Crea tu usuario, tu negocio y tu primera sucursal.
        </p>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          name="name"
          autoComplete="name"
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          name="email"
          autoComplete="email"
          className="border p-2 rounded"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            name="password"
            autoComplete="new-password"
            className="border p-2 rounded w-full pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M6.343 6.343A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.22-.402 4.575-1.125M17.657 17.657A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.22.402-4.575 1.125M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.857-.642 1.67-1.09 2.418"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            name="confirmPassword"
            autoComplete="new-password"
            className="border p-2 rounded w-full pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={
              showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showConfirm ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M6.343 6.343A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.22-.402 4.575-1.125M17.657 17.657A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.22.402-4.575 1.125M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.857-.642 1.67-1.09 2.418"
                />
              </svg>
            )}
          </button>
        </div>
        <hr className="my-2" />
        <h2 className="text-lg font-semibold">Tu negocio</h2>
        <input
          type="text"
          placeholder="Nombre del negocio"
          value={negocioNombre}
          onChange={(e) => setNegocioNombre(e.target.value)}
          required
          name="negocioNombre"
          autoComplete="organization"
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={negocioDescripcion}
          onChange={(e) => setNegocioDescripcion(e.target.value)}
          name="negocioDescripcion"
          autoComplete="off"
          className="border p-2 rounded"
        />
        <h3 className="text-md font-medium mt-2">Primera sucursal</h3>
        <input
          type="text"
          placeholder="Nombre de la sucursal"
          value={sucursalNombre}
          onChange={(e) => setSucursalNombre(e.target.value)}
          required
          name="sucursalNombre"
          autoComplete="organization"
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Dirección (opcional)"
          value={sucursalDireccion}
          onChange={(e) => setSucursalDireccion(e.target.value)}
          name="sucursalDireccion"
          autoComplete="street-address"
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
      </form>
    </div>
  );
}
