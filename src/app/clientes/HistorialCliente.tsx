"use client";
import useSWR from "swr";
import { useAuthFetch } from "@/lib/useAuthFetch";

interface Venta {
  id: number;
  fecha: string;
  total: number;
  sucursal?: { nombre: string };
  usuario?: { nombre: string };
  productos: { cantidad: number; producto: { nombre: string } }[];
}

export default function HistorialCliente({ clienteId }: { clienteId: number }) {
  const { swrFetcher } = useAuthFetch();
  const { data: ventas = [], isLoading } = useSWR<Venta[]>(
    `/api/clientes/historial/${clienteId}`,
    (url: string) => swrFetcher(url)
  );
  if (isLoading)
    return <div className="text-center">Cargando historial...</div>;
  if (!ventas.length)
    return (
      <div className="text-center text-gray-500">Sin compras registradas</div>
    );
  return (
    <div className="mt-6">
      <h2 className="font-bold mb-2">Historial de compras</h2>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-zinc-800">
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Sucursal</th>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Productos</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id}>
              <td className="p-2 border">{v.fecha.slice(0, 10)}</td>
              <td className="p-2 border">{v.sucursal?.nombre || "-"}</td>
              <td className="p-2 border">{v.usuario?.nombre || "-"}</td>
              <td className="p-2 border">
                {v.productos.map((p, i) => (
                  <span key={i}>
                    {p.cantidad} x {p.producto.nombre}
                    {i < v.productos.length - 1 ? ", " : ""}
                  </span>
                ))}
              </td>
              <td className="p-2 border">${v.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
