import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/reportes/productos-mas-vendidos
export async function GET(req: Request) {
  // Permisos: requiere poder ver reportes
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "reportes.ver")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const url = new URL(req.url);
  const desde = url.searchParams.get("desde");
  const hasta = url.searchParams.get("hasta");
  const sucursalIdQuery = url.searchParams.get("sucursalId");
  const negocioIdQuery = url.searchParams.get("negocioId");
  let sucursalId: number | undefined = undefined;
  if (sucursalIdQuery) {
    const n = Number(sucursalIdQuery);
    if (!Number.isNaN(n)) sucursalId = n;
  } else if (session?.user && typeof session.user.sucursalId === "number") {
    sucursalId = session.user.sucursalId;
  }
  // Filtro por negocio si no hay sucursal
  const negocioId = negocioIdQuery ? Number(negocioIdQuery) : undefined;

  // Construir filtro por fecha si es válido
  let fechaWhere: { gte?: Date; lte?: Date } | undefined = undefined;
  if (desde || hasta) {
    fechaWhere = {};
    if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) {
      fechaWhere.gte = new Date(`${desde}T00:00:00.000Z`);
    }
    if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      // incluir todo el día hasta 23:59:59.999Z
      const h = new Date(`${hasta}T23:59:59.999Z`);
      const now = new Date();
      fechaWhere.lte = h > now ? now : h;
    }
    if (Object.keys(fechaWhere).length === 0) {
      fechaWhere = undefined;
    }
  }

  // Si viene negocioId y no hay sucursalId, resolvemos IDs de sucursal del negocio
  let sucursalIdsForNegocio: number[] | undefined = undefined;
  if (
    !sucursalId &&
    typeof negocioId === "number" &&
    !Number.isNaN(negocioId)
  ) {
    const sucWhere = {
      negocioId,
    } as unknown as import("@prisma/client").Prisma.SucursalWhereInput;
    const sucursales = await prisma.sucursal.findMany({
      where: sucWhere,
      select: { id: true },
    });
    sucursalIdsForNegocio = sucursales.map((s) => s.id);
  }

  // Agrupa por producto, suma cantidad y total vendido
  const productos = await prisma.ventaProducto.groupBy({
    by: ["productoId"],
    _sum: { cantidad: true, subtotal: true },
    orderBy: { _sum: { cantidad: "desc" } },
    where: {
      venta: {
        is: {
          ...(fechaWhere ? { fecha: fechaWhere } : {}),
          ...(typeof sucursalId === "number"
            ? { sucursalId }
            : sucursalIdsForNegocio && sucursalIdsForNegocio.length > 0
            ? { sucursalId: { in: sucursalIdsForNegocio } }
            : {}),
        },
      },
    },
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
