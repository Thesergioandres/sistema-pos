import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/reportes/pagos-divididos
export async function GET(req: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "reportes.ver")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const url = new URL(req.url);
  const sucursalIdQuery = url.searchParams.get("sucursalId");
  const negocioIdQuery = url.searchParams.get("negocioId");
  const desde = url.searchParams.get("desde");
  const hasta = url.searchParams.get("hasta");

  let sucursalId: number | undefined = undefined;
  if (sucursalIdQuery) {
    const n = Number(sucursalIdQuery);
    if (!Number.isNaN(n)) sucursalId = n;
  }

  let sucursalIdsForNegocio: number[] | undefined = undefined;
  const negocioId = negocioIdQuery ? Number(negocioIdQuery) : undefined;
  if (
    !sucursalId &&
    typeof negocioId === "number" &&
    !Number.isNaN(negocioId)
  ) {
    const sucursales = await prisma.sucursal.findMany({
      where: {
        negocioId,
      } as unknown as import("@prisma/client").Prisma.SucursalWhereInput,
      select: { id: true },
    });
    sucursalIdsForNegocio = sucursales.map((s) => s.id);
  }

  let fechaWhere: { gte?: Date; lte?: Date } | undefined = undefined;
  if (desde || hasta) {
    fechaWhere = {};
    if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde))
      fechaWhere.gte = new Date(`${desde}T00:00:00.000Z`);
    if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      const h = new Date(`${hasta}T23:59:59.999Z`);
      const now = new Date();
      fechaWhere.lte = h > now ? now : h;
    }
    if (Object.keys(fechaWhere).length === 0) fechaWhere = undefined;
  }

  const ventas = await prisma.venta.findMany({
    where: {
      ...(fechaWhere ? { fecha: fechaWhere } : {}),
      ...(typeof sucursalId === "number"
        ? { sucursalId }
        : sucursalIdsForNegocio && sucursalIdsForNegocio.length > 0
        ? { sucursalId: { in: sucursalIdsForNegocio } }
        : {}),
    },
    include: {
      pagos: true,
      usuario: true,
    },
    orderBy: { fecha: "desc" },
    take: 100,
  });
  return NextResponse.json(ventas);
}
