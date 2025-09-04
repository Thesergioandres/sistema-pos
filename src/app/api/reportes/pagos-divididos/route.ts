import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/pagos-divididos
export async function GET() {
  // Trae todas las ventas con sus pagos divididos
  const ventas = await prisma.venta.findMany({
    include: {
      pagos: true,
      usuario: true,
    },
    orderBy: { fecha: "desc" },
    take: 100,
  });
  return NextResponse.json(ventas);
}
