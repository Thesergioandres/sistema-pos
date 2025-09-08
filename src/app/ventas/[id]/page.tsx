"use client";
import React, { useCallback, useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { withRole } from "../../components/withRole";
import { withPermission } from "../../components/withPermission";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useToast } from "@/components/toast/ToastProvider";

type VentaDetalle = {
  venta: {
    id: number;
    fecha: string;
    total: number;
    montoRecibido: number | null;
    cambio: number | null;
    medioPago: string;
  };
  cliente: { id: number; nombre: string; telefono?: string | null } | null;
  items: Array<{
    id: number;
    productoId: number;
    cantidad: number;
    subtotal: number;
    pagado: number;
    saldo: number;
  }>;
  pagos: Array<{
    id: number;
    tipo: string;
    monto: number;
    ventaProductoId?: number | null;
  }>;
  totales: { totalPagos: number; saldoTotal: number };
};

function VentaDetallePage() {
  const { swrFetcher, authFetch } = useAuthFetch();
  const { show } = useToast();
  const params = useParams<{ id: string }>() as { id?: string } | null;
  const id = Number(params?.id);
  const router = useRouter();
  const [saldada, setSaldada] = useState(false);
  const { data, isLoading, error } = useSWR<VentaDetalle>(
    Number.isFinite(id) ? `/api/ventas/${id}` : null,
    (url: string) => swrFetcher(url)
  );

  const registrarPago = useCallback(
    async (payload: {
      tipo: string;
      monto: number;
      ventaProductoId?: number;
    }) => {
      try {
        const res = await authFetch(`/api/ventas/${id}/pagos`, {
          method: "POST",
          body: payload,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Error al registrar pago");
        }
        await mutate(`/api/ventas/${id}`);
        await mutate("/api/ventas/pendientes");
        show("Pago registrado", "success");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al registrar pago";
        show(msg, "error");
        throw e;
      }
    },
    [id, authFetch, show]
  );

  // Si la venta ya no tiene saldo, redirigir a pendientes
  useEffect(() => {
    if (!isLoading && data && data.totales.saldoTotal <= 0.001 && !saldada) {
      setSaldada(true);
      // Toast homogéneo al saldar la venta
      show("Venta saldada", "success");
      const t = setTimeout(() => {
        router.replace(`/ventas/pendientes?fromVentaId=${id}&status=saldada`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [isLoading, data, saldada, router, show, id]);

  if (!Number.isFinite(id)) {
    return <div className="p-4">ID de venta inválido</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Venta #{id}</h1>
        <div className="flex gap-2">
          <Link
            href={`/ventas/pendientes?fromVentaId=${id}`}
            className="px-3 py-2 rounded bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300"
          >
            Pendientes
          </Link>
          <Link
            href="/ventas"
            className="px-3 py-2 rounded bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300"
          >
            Ventas
          </Link>
        </div>
      </div>

      {isLoading && <div>Cargando…</div>}
      {error && <div className="text-red-600">Error al cargar venta</div>}
      {!isLoading && data && (
        <div className="space-y-6">
          <section className="bg-white dark:bg-zinc-900 rounded p-4 shadow">
            <h2 className="font-semibold mb-2">Resumen</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Fecha:</span>{" "}
                {data.venta.fecha?.slice(0, 10)}
              </div>
              <div>
                <span className="text-gray-500">Total:</span> $
                {data.venta.total.toFixed(2)}
              </div>
              <div>
                <span className="text-gray-500">Pagado:</span> $
                {data.totales.totalPagos.toFixed(2)}
              </div>
              <div>
                <span className="text-gray-500">Saldo:</span> $
                {data.totales.saldoTotal.toFixed(2)}
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Cliente:</span>{" "}
                {data.cliente
                  ? `${data.cliente.nombre}${
                      data.cliente.telefono ? " • " + data.cliente.telefono : ""
                    }`
                  : "-"}
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded p-4 shadow overflow-x-auto">
            <h2 className="font-semibold mb-2">Productos</h2>
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-zinc-800">
                  <th className="p-2 border">ProductoID</th>
                  <th className="p-2 border">Cant.</th>
                  <th className="p-2 border">Subtotal</th>
                  <th className="p-2 border">Pagado</th>
                  <th className="p-2 border">Saldo</th>
                  <th className="p-2 border">Abonar</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-2 border text-center">{it.productoId}</td>
                    <td className="p-2 border text-center">{it.cantidad}</td>
                    <td className="p-2 border">${it.subtotal.toFixed(2)}</td>
                    <td className="p-2 border">${it.pagado.toFixed(2)}</td>
                    <td className="p-2 border font-semibold">
                      ${it.saldo.toFixed(2)}
                    </td>
                    <td className="p-2 border">
                      <form
                        className="flex gap-2"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget as HTMLFormElement;
                          const input = form.elements.namedItem(
                            "monto"
                          ) as HTMLInputElement;
                          const tipoSel = form.elements.namedItem(
                            "tipo"
                          ) as HTMLSelectElement;
                          const monto = Number(input.value);
                          const tipo = tipoSel.value;
                          if (!monto || monto <= 0) return;
                          try {
                            await registrarPago({
                              tipo,
                              monto,
                              ventaProductoId: it.id,
                            });
                            form.reset();
                          } catch {}
                        }}
                      >
                        <select
                          name="tipo"
                          defaultValue="efectivo"
                          className="border p-1 rounded"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                        </select>
                        <input
                          name="monto"
                          type="number"
                          min={0.01}
                          step={0.01}
                          placeholder="Monto"
                          className="border p-1 rounded w-28"
                        />
                        <button className="px-2 py-1 bg-blue-600 text-white rounded">
                          Abonar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded p-4 shadow">
            <h2 className="font-semibold mb-2">Abono global</h2>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.elements.namedItem(
                  "monto"
                ) as HTMLInputElement;
                const tipoSel = form.elements.namedItem(
                  "tipo"
                ) as HTMLSelectElement;
                const monto = Number(input.value);
                const tipo = tipoSel.value;
                if (!monto || monto <= 0) return;
                try {
                  await registrarPago({ tipo, monto });
                  form.reset();
                } catch {}
              }}
            >
              <select
                name="tipo"
                defaultValue="efectivo"
                className="border p-2 rounded"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <input
                name="monto"
                type="number"
                min={0.01}
                step={0.01}
                placeholder="Monto"
                className="border p-2 rounded w-40"
              />
              <button className="px-3 py-2 bg-blue-600 text-white rounded">
                Abonar
              </button>
            </form>
          </section>

          <section className="bg-white dark:bg-zinc-900 rounded p-4 shadow overflow-x-auto">
            <h2 className="font-semibold mb-2">Historial de pagos</h2>
            {data.pagos.length === 0 ? (
              <div className="text-gray-500 text-sm">Sin pagos.</div>
            ) : (
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-zinc-800">
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Tipo</th>
                    <th className="p-2 border">Monto</th>
                    <th className="p-2 border">Producto (opcional)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pagos.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 border text-center">{p.id}</td>
                      <td className="p-2 border">{p.tipo}</td>
                      <td className="p-2 border">${p.monto.toFixed(2)}</td>
                      <td className="p-2 border text-center">
                        {p.ventaProductoId ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default withPermission(
  withRole(VentaDetallePage, ["admin", "vendedor", "cajero"]),
  ["ventas.detalle"]
);
