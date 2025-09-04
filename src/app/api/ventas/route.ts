import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;
  let sucursalId: number | undefined = undefined;
  if (session?.user && typeof session.user.sucursalId === "number") {
    sucursalId = session.user.sucursalId;
  }
  const where = sucursalId ? { sucursalId } : {};
  const ventas = await prisma.venta.findMany({ where });
  return NextResponse.json(ventas);
}

export async function POST(request: Request) {
  const data = await request.json();
  const { usuarioId, productos, combos, total, pagos, cambio } = data;

  // 1. Crear la venta principal
  // Asumimos que medioPago y usuario deben venir en el body o se pueden deducir
  // Si no existen, poner valores por defecto o lanzar error
  const medioPago = pagos && pagos.length > 0 ? pagos[0].tipo : "efectivo";
  // Buscar usuario relacionado
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 400 }
    );
  }
  const venta = await prisma.venta.create({
    data: {
      usuarioId,
      total,
      cambio,
      medioPago,
      usuario: { connect: { id: usuarioId } },
    },
  });

  // 1.1 Registrar los pagos divididos
  if (pagos && Array.isArray(pagos)) {
    for (const pago of pagos) {
      await prisma.ventaPago.create({
        data: {
          ventaId: venta.id,
          tipo: pago.tipo,
          monto: pago.monto,
        },
      });
    }
  }

  // 2. Registrar productos individuales
  for (const item of productos) {
    const { productoId, cantidad } = item;
    // Buscar receta del producto
    const recetas = await prisma.receta.findMany({ where: { productoId } });
    // Descontar insumos según receta
    for (const receta of recetas) {
      await prisma.insumo.update({
        where: { id: receta.insumoId },
        data: {
          stock: {
            decrement: receta.cantidad * cantidad,
          },
        },
      });
    }
    // Registrar el producto vendido
    const subtotal = cantidad * (item.precio ?? 0);
    await prisma.ventaProducto.create({
      data: {
        ventaId: venta.id,
        productoId,
        cantidad,
        subtotal,
      },
    });
  }

  // 3. Registrar combos vendidos
  if (combos && Array.isArray(combos)) {
    for (const comboVenta of combos) {
      const { comboId, cantidad } = comboVenta;
      // Obtener productos del combo
      const combo = await prisma.combo.findUnique({
        where: { id: comboId },
        include: { productos: { include: { producto: true } } },
      });
      if (!combo) continue;
      // Por cada producto del combo, registrar en VentaProducto y descontar insumos
      for (const cp of combo.productos) {
        // Descontar insumos según receta del producto
        const recetas = await prisma.receta.findMany({
          where: { productoId: cp.productoId },
        });
        for (const receta of recetas) {
          await prisma.insumo.update({
            where: { id: receta.insumoId },
            data: {
              stock: {
                decrement: receta.cantidad * cp.cantidad * cantidad,
              },
            },
          });
        }
        // Registrar el producto vendido por combo
        const subtotal = (cp.producto?.precio ?? 0) * cp.cantidad * cantidad;
        await prisma.ventaProducto.create({
          data: {
            ventaId: venta.id,
            productoId: cp.productoId,
            cantidad: cp.cantidad * cantidad,
            subtotal,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, ventaId: venta.id });
}
