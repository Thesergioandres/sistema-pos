import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!hasPermission(session, "ventas.pendientes")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const ventas = await prisma.venta.findMany({
      include: { pagos: true, productos: true },
      orderBy: { fecha: "desc" },
    });
    const pendientes = ventas
      .map((v) => {
        const pagado = v.pagos.reduce((acc, p) => acc + p.monto, 0);
        const saldo = Math.max(0, v.total - pagado);
        return { id: v.id, fecha: v.fecha, total: v.total, pagado, saldo };
      })
      .filter((x) => x.saldo > 0.001);
    return NextResponse.json(pendientes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al listar pendientes" },
      { status: 500 }
    );
  }
}
