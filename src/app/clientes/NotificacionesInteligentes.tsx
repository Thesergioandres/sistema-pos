"use client";
import { useMemo } from "react";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";

interface Cliente {
  id: number;
  nombre: string;
  fechaNacimiento?: string;
  creadoEn: string;
}

export default function NotificacionesInteligentes() {
  const { swrFetcher } = useAuthFetch();
  const { data: clientes = [] } = useSWR<Cliente[]>(
    "/api/clientes",
    (url: string) => swrFetcher(url)
  );
  const hoy = useMemo(() => new Date(), []);
  // Cumpleaños hoy
  const cumpleanios = useMemo(
    () =>
      clientes.filter(
        (c) =>
          c.fechaNacimiento &&
          new Date(c.fechaNacimiento).getDate() === hoy.getDate() &&
          new Date(c.fechaNacimiento).getMonth() === hoy.getMonth()
      ),
    [clientes, hoy]
  );
  // Clientes inactivos (no compran hace 30 días)
  // Aquí podrías hacer un fetch a /api/clientes/historial/[id] y calcular, pero para demo solo muestra aviso si existe fechaNacimiento y creadoEn > 30 días
  const inactivos = useMemo(
    () =>
      clientes.filter((c) => {
        const creado = new Date(c.creadoEn);
        return hoy.getTime() - creado.getTime() > 1000 * 60 * 60 * 24 * 30;
      }),
    [clientes, hoy]
  );
  // Sugerencia: reactivar clientes inactivos
  const sugerenciaReactivar =
    inactivos.length > 0
      ? `Considera enviar una promoción o recordatorio a ${inactivos
          .map((c) => c.nombre)
          .join(", ")}`
      : null;

  // Sugerencia: premiar clientes frecuentes (demo: los que tienen fechaNacimiento y fueron creados hace más de 1 año)
  const frecuentes = useMemo(
    () =>
      clientes.filter((c) => {
        const creado = new Date(c.creadoEn);
        return (
          c.fechaNacimiento &&
          hoy.getTime() - creado.getTime() > 1000 * 60 * 60 * 24 * 365
        );
      }),
    [clientes, hoy]
  );
  const sugerenciaPremio =
    frecuentes.length > 0
      ? `Premia la lealtad de: ${frecuentes.map((c) => c.nombre).join(", ")}`
      : null;

  return (
    <div className="mb-4">
      {cumpleanios.length > 0 && (
        <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-2">
          🎂 Hoy es cumpleaños de: {cumpleanios.map((c) => c.nombre).join(", ")}
        </div>
      )}
      {inactivos.length > 0 && (
        <div className="bg-blue-100 text-blue-800 p-2 rounded mb-2">
          👀 Clientes sin compras recientes:{" "}
          {inactivos.map((c) => c.nombre).join(", ")}
        </div>
      )}
      {sugerenciaReactivar && (
        <div className="bg-orange-100 text-orange-800 p-2 rounded mb-2">
          💡 {sugerenciaReactivar}
        </div>
      )}
      {sugerenciaPremio && (
        <div className="bg-green-100 text-green-800 p-2 rounded mb-2">
          🏆 {sugerenciaPremio}
        </div>
      )}
    </div>
  );
}
