import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";

// GET /api/reportes/productos-mas-vendidos
export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;
  let sucursalId: number | undefined = undefined;
  if (session?.user && typeof session.user.sucursalId === "number") {
    sucursalId = session.user.sucursalId;
  }
  // Agrupa por producto, suma cantidad y total vendido solo de la sucursal
  const productos = await prisma.ventaProducto.groupBy({
    by: ["productoId"],
    _sum: { cantidad: true, subtotal: true },
    orderBy: { _sum: { cantidad: "desc" } },
    where: sucursalId ? { venta: { sucursalId } } : undefined,
  });

  // Obtiene los nombres y precios de los productos
  const productosInfo = await prisma.producto.findMany({
    where: {
      id: { in: productos.map((p: { productoId: number }) => p.productoId) },
    },
    select: { id: true, nombre: true, precio: true },
  });

  // Une la info
  const ranking = productos.map(
    (p: {
      productoId: number;
      _sum?: { cantidad?: number | null; subtotal?: number | null };
    }) => {
      const info = productosInfo.find(
        (i: { id: number; nombre: string; precio: number }) =>
          i.id === p.productoId
      );
      return {
        productoId: p.productoId,
        nombre: info?.nombre || "",
        precio: info?.precio || 0,
        cantidadVendida: p._sum?.cantidad ?? 0,
        ingresos: p._sum?.subtotal ?? 0,
      };
    }
  );

  return NextResponse.json(ranking);
}
