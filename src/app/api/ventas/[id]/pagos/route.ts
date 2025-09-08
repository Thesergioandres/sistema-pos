import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasAnyPermission } from "@/lib/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!hasAnyPermission(session, ["ventas.pagos", "ventas.detalle"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id } = await params;
    const ventaId = Number(id);
    if (!Number.isFinite(ventaId) || ventaId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const body = await request.json();
    const { tipo, monto, ventaProductoId } = body ?? {};
    if (
      typeof tipo !== "string" ||
      typeof monto !== "number" ||
      monto <= 0 ||
      (ventaProductoId !== undefined &&
        ventaProductoId !== null &&
        !Number.isFinite(Number(ventaProductoId)))
    ) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    // Validar venta e item si aplica
    const venta = await prisma.venta.findUnique({ where: { id: ventaId } });
    if (!venta)
      return NextResponse.json({ error: "Venta no existe" }, { status: 404 });

    let vpId: number | null = null;
    if (ventaProductoId != null) {
      const vp = await prisma.ventaProducto.findFirst({
        where: { id: Number(ventaProductoId), ventaId },
      });
      if (!vp)
        return NextResponse.json({ error: "Item no existe" }, { status: 404 });
      vpId = vp.id;
    }

    const dataBase: {
      ventaId: number;
      tipo: string;
      monto: number;
      ventaProductoId?: number;
    } = {
      ventaId,
      tipo,
      monto,
    };
    if (vpId != null) {
      dataBase.ventaProductoId = vpId;
    }
    try {
      await prisma.ventaPago.create({
        data: dataBase as unknown as Parameters<
          typeof prisma.ventaPago.create
        >[0]["data"],
      });
    } catch (err) {
      // Fallback si el cliente Prisma aún no conoce ventaProductoId
      if (vpId != null) {
        await prisma.ventaPago.create({ data: { ventaId, tipo, monto } });
      } else {
        throw err;
      }
    }

    // Recalcular monto recibido
    const pagos = await prisma.ventaPago.findMany({ where: { ventaId } });
    const newMonto = pagos.reduce((acc, p) => acc + p.monto, 0);
    await prisma.venta.update({
      where: { id: ventaId },
      data: { montoRecibido: newMonto },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al registrar pago" },
      { status: 500 }
    );
  }
}
