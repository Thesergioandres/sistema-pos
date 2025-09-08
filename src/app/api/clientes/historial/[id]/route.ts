import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

// GET: Historial de compras de un cliente
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (
    !hasPermission(session, "reportes.ver") &&
    !hasPermission(session, "clientes.gestion")
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const ventas = await prisma.venta.findMany({
    where: { clienteId: Number(id) },
    include: {
      productos: { include: { producto: true } },
      sucursal: true,
      usuario: true,
    },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(ventas);
}
