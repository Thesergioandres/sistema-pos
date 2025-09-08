"use client";
import React, { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";
import Link from "next/link";
import { withRole } from "../../components/withRole";
import { withPermission } from "../../components/withPermission";
import { useToast } from "@/components/toast/ToastProvider";
import { useSearchParams, useRouter } from "next/navigation";

type Pendiente = {
  id: number;
  fecha: string;
  total: number;
  pagado: number;
  saldo: number;
};

function PendientesPage() {
  const { swrFetcher } = useAuthFetch();
  const { show } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const { data, isLoading, error } = useSWR<Pendiente[]>(
    "/api/ventas/pendientes",
    (url: string) => swrFetcher(url),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  // Si llegamos desde una venta saldada, avisar con toast y limpiar la URL
  useEffect(() => {
    const fromVentaId = searchParams?.get("fromVentaId");
    const status = searchParams?.get("status");
    if (fromVentaId) {
      const nId = Number(fromVentaId);
      if (Number.isFinite(nId)) setHighlightId(nId);
      // Solo mostrar toast cuando efectivamente se saldó la venta
      if (status === "saldada") {
        show(`Venta #${fromVentaId} saldada`, "success", 1800);
      }
      const cleanUrl = "/ventas/pendientes";
      router.replace(cleanUrl);
      // Revalidar la lista inmediatamente
      mutate("/api/ventas/pendientes");
    }
  }, [searchParams, show, router]);

  // Desplazar y resaltar la fila de la venta de origen
  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`venta-${highlightId}`);
    if (el) {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "center",
      });
      const t = setTimeout(() => setHighlightId(null), 1800);
      return () => clearTimeout(t);
    }
  }, [highlightId, data]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ventas pendientes</h1>
        <Link
          href="/ventas"
          className="px-3 py-2 rounded bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300"
        >
          Volver a ventas
        </Link>
      </div>
      {isLoading && <div>Cargando…</div>}
      {error && <div className="text-red-600">Error al cargar pendientes</div>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="text-gray-500">No hay ventas pendientes.</div>
      )}
      {(data?.length ?? 0) > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Fecha</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Pagado</th>
                <th className="p-2 border">Saldo</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((v) => (
                <tr
                  key={v.id}
                  id={`venta-${v.id}`}
                  className={`hover:bg-blue-50 transition-colors duration-700 motion-reduce:transition-none ${
                    highlightId === v.id
                      ? searchParams?.get("status") === "saldada"
                        ? "bg-green-50"
                        : "bg-yellow-50"
                      : ""
                  }`}
                >
                  <td className="p-2 border text-center">{v.id}</td>
                  <td className="p-2 border">{v.fecha?.slice(0, 10)}</td>
                  <td className="p-2 border">${v.total.toFixed(2)}</td>
                  <td className="p-2 border">${v.pagado.toFixed(2)}</td>
                  <td className="p-2 border font-semibold">
                    ${v.saldo.toFixed(2)}
                  </td>
                  <td className="p-2 border text-center">
                    <Link
                      className="text-blue-600 hover:underline"
                      href={`/ventas/${v.id}`}
                    >
                      Ver detalle / Abonar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default withPermission(
  withRole(PendientesPage, ["admin", "vendedor", "cajero"]),
  ["ventas.pendientes"]
);
