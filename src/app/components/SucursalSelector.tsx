"use client";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useState } from "react";

export default function SucursalSelector() {
  const { data: session, update } = useSession();
  const { data: sucursales = [] } = useSWR<{ id: number; nombre: string }[]>(
    "/api/sucursales",
    (url: string) => fetch(url).then((r) => r.json())
  );
  const [loading, setLoading] = useState(false);
  const sucursalId = session?.user?.sucursalId;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaSucursalId = Number(e.target.value);
    setLoading(true);
    // Actualizar sucursalId en el backend y en el token de sesión
    await fetch("/api/usuarios/cambiar-sucursal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sucursalId: nuevaSucursalId }),
    });
    await update(); // Refresca la sesión
    setLoading(false);
  };

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded mb-2">
      <span className="font-semibold">Sucursal activa:</span>
      <select
        value={sucursalId || ""}
        onChange={handleChange}
        disabled={loading}
        className="border p-1 rounded"
      >
        <option value="">Selecciona sucursal</option>
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>
      {loading && (
        <span className="text-xs text-blue-600 ml-2">Cambiando...</span>
      )}
    </div>
  );
}
