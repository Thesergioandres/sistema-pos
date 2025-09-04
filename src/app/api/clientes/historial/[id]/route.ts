import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Historial de compras de un cliente
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ventas = await prisma.venta.findMany({
    where: { clienteId: Number(params.id) },
    include: {
      productos: { include: { producto: true } },
      sucursal: true,
      usuario: true,
    },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(ventas);
}
