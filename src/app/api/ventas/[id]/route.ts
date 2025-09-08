import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!hasPermission(session, "ventas.detalle")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const sucursalId =
      session?.user && typeof session.user.sucursalId === "number"
        ? session.user.sucursalId
        : undefined;

    const venta = await prisma.venta.findFirst({
      where: {
        id,
        ...(sucursalId ? { sucursalId } : {}),
      },
      include: {
        productos: true,
        pagos: true,
        cliente: true,
      },
    });
    if (!venta) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Calcular saldos por producto y global
    const pagosPorProducto = new Map<number, number>();
    for (const p of venta.pagos as Array<{
      id: number;
      ventaId: number;
      tipo: string;
      monto: number;
      ventaProductoId?: number | null;
    }>) {
      const vpId =
        (p as unknown as { ventaProductoId?: number | null }).ventaProductoId ??
        null;
      if (vpId != null) {
        const prev = pagosPorProducto.get(vpId) || 0;
        pagosPorProducto.set(vpId, prev + p.monto);
      }
    }

    const items = venta.productos.map((vp) => {
      const pagado = pagosPorProducto.get(vp.id) || 0;
      const saldo = Math.max(0, vp.subtotal - pagado);
      return { ...vp, pagado, saldo };
    });

    const totalPagos = venta.pagos.reduce((acc, p) => acc + p.monto, 0);
    const saldoTotal = Math.max(0, venta.total - totalPagos);

    return NextResponse.json({
      venta: {
        id: venta.id,
        fecha: venta.fecha,
        usuarioId: venta.usuarioId,
        sucursalId: venta.sucursalId,
        clienteId: venta.clienteId,
        total: venta.total,
        medioPago: venta.medioPago,
        montoRecibido: venta.montoRecibido,
        cambio: venta.cambio,
      },
      cliente: venta.cliente
        ? {
            id: venta.cliente.id,
            nombre: venta.cliente.nombre,
            telefono: venta.cliente.telefono,
          }
        : null,
      items,
      pagos: venta.pagos,
      totales: { totalPagos, saldoTotal },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al obtener venta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "ventas.listado")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await prisma.venta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
