"use client";
import { useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { authFetch } from "@/lib/http";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingNegocio() {
  const { show } = useToast();
  const router = useRouter();
  const { update } = useSession();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sucursal, setSucursal] = useState("");
  const [direccion, setDireccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim() || !sucursal.trim()) {
      setError("Nombre del negocio y de la sucursal son obligatorios");
      return;
    }
    setLoading(true);
    try {
      // 1) Crear negocio (asigna al usuario actual como propietario)
      const resNeg = await authFetch("/api/negocios", {
        method: "POST",
        body: { nombre: nombre.trim(), descripcion: descripcion || null },
      });
      if (!resNeg.ok) throw new Error("Error al crear negocio");
      const negocio = await resNeg.json();
      const negocioId = negocio?.id as number | undefined;

      // 2) Crear sucursal principal
      const resSuc = await authFetch("/api/sucursales", {
        method: "POST",
        body: {
          nombre: sucursal.trim(),
          direccion: direccion || null,
          negocioId,
        },
      });
      if (!resSuc.ok) throw new Error("Error al crear sucursal");
      const suc = await resSuc.json();

      // 3) Asignar sucursal al usuario actual
      const resAsign = await authFetch("/api/usuarios/cambiar-sucursal", {
        method: "POST",
        body: { sucursalId: suc.id },
      });
      if (!resAsign.ok) throw new Error("Error al asignar sucursal al usuario");
      await update();

      show("Negocio creado correctamente", "success");
      router.replace("/ventas");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error al crear negocio/sucursal"
      );
      show("Error al crear negocio/sucursal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow p-6 w-full max-w-md space-y-3"
      >
        <h1 className="text-2xl font-bold">Crear negocio</h1>
        <input
          placeholder="Nombre del negocio"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <input
          placeholder="Descripción (opcional)"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <hr className="my-2" />
        <input
          placeholder="Nombre de la sucursal principal"
          value={sucursal}
          onChange={(e) => setSucursal(e.target.value)}
          className="border p-2 rounded w-full"
          required
        />
        <input
          placeholder="Dirección (opcional)"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 w-full disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear negocio"}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
}
