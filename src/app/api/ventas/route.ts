import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!hasPermission(session, "ventas.listado")) {
      // Evitar ruido de 403 en UI: devolver lista vacía
      return NextResponse.json([]);
    }
    const { searchParams } = new URL(request.url);
    const sucursalIdParam = searchParams.get("sucursalId");
    const negocioIdParam = searchParams.get("negocioId");
    const desdeParam = searchParams.get("desde");
    const hastaParam = searchParams.get("hasta");
    let sucursalId: number | undefined = undefined;
    if (session?.user && typeof session.user.sucursalId === "number") {
      sucursalId = session.user.sucursalId;
    }
    if (!sucursalId && sucursalIdParam) {
      const n = Number(sucursalIdParam);
      if (!Number.isNaN(n)) sucursalId = n;
    }
    // Construir filtro base por sucursal o negocio
    let where: Prisma.VentaWhereInput = {};
    if (typeof sucursalId === "number") {
      where = { ...where, sucursalId } as unknown as Prisma.VentaWhereInput;
    } else if (negocioIdParam) {
      const n = Number(negocioIdParam);
      if (!Number.isNaN(n)) {
        where = {
          ...where,
          sucursal: { is: { negocioId: n } },
        } as unknown as Prisma.VentaWhereInput;
      }
    }

    // Filtro por rango de fechas (inclusive)
    const fechaFilter: { gte?: Date; lte?: Date } = {};
    if (desdeParam) {
      const d = new Date(desdeParam);
      if (!Number.isNaN(d.getTime())) fechaFilter.gte = d;
    }
    if (hastaParam) {
      const h = new Date(hastaParam);
      if (!Number.isNaN(h.getTime())) {
        // Asegurar fin del día (23:59:59.999) si es fecha sin hora
        h.setHours(23, 59, 59, 999);
        fechaFilter.lte = h;
      }
    }
    if (fechaFilter.gte || fechaFilter.lte) {
      // No futuros: limitar 'hasta' (lte) a ahora
      const now = new Date();
      if (fechaFilter.lte && fechaFilter.lte > now) {
        fechaFilter.lte = now;
      }
      where = { ...where, fecha: fechaFilter } as Prisma.VentaWhereInput;
    }

    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { fecha: "asc" },
    });
    return NextResponse.json(ventas);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al listar ventas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!hasPermission(session, "ventas.registrar")) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }
    const data = await request.json();
    const { usuarioId, productos, combos, total, pagos, cambio, clienteId } =
      data ?? {};

    // Validación básica
    if (
      typeof usuarioId !== "number" ||
      !Array.isArray(productos) ||
      productos.length === 0 ||
      typeof total !== "number" ||
      total < 0 ||
      !Array.isArray(pagos) ||
      pagos.length === 0 ||
      typeof pagos[0]?.tipo !== "string" ||
      typeof pagos[0]?.monto !== "number" ||
      pagos[0].monto < 0 ||
      (cambio !== undefined && typeof cambio !== "number") ||
      (clienteId !== undefined && typeof clienteId !== "number")
    ) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 400 }
      );
    }

    const medioPago = pagos[0].tipo || "efectivo";

    // Crear venta con posible sucursalId del usuario (total se recalculará)
    const venta = await prisma.venta.create({
      data: {
        usuarioId,
        total: 0,
        cambio: cambio ?? 0,
        medioPago,
        sucursalId: usuario.sucursalId ?? null,
        clienteId: clienteId ?? null,
      },
    });

    // Pagos
    for (const pago of pagos) {
      await prisma.ventaPago.create({
        data: {
          ventaId: venta.id,
          tipo: pago.tipo,
          monto: pago.monto,
        },
      });
    }

    let acumuladoTotal = 0;

    // Productos individuales
    for (const item of productos as Array<{
      productoId: number;
      cantidad: number;
    }>) {
      const { productoId, cantidad } = item;
      if (
        typeof productoId !== "number" ||
        typeof cantidad !== "number" ||
        cantidad <= 0
      ) {
        return NextResponse.json(
          { error: "Producto inválido" },
          { status: 400 }
        );
      }
      // Precio desde DB
      const prod = await prisma.producto.findUnique({
        where: { id: productoId },
      });
      const precio = prod?.precio ?? 0;
      const subtotal = cantidad * precio;
      acumuladoTotal += subtotal;

      // Descontar insumos por receta
      const recetas = await prisma.receta.findMany({ where: { productoId } });
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

      await prisma.ventaProducto.create({
        data: {
          ventaId: venta.id,
          productoId,
          cantidad,
          subtotal,
        },
      });
    }

    // Combos
    if (Array.isArray(combos)) {
      for (const comboVenta of combos as Array<{
        comboId: number;
        cantidad: number;
      }>) {
        const { comboId, cantidad } = comboVenta;
        if (
          typeof comboId !== "number" ||
          typeof cantidad !== "number" ||
          cantidad <= 0
        ) {
          return NextResponse.json(
            { error: "Combo inválido" },
            { status: 400 }
          );
        }
        const combo = await prisma.combo.findUnique({
          where: { id: comboId },
          include: { productos: { include: { producto: true } } },
        });
        if (!combo) continue;
        for (const cp of combo.productos) {
          // Descontar insumos del producto del combo
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
          const precio = cp.producto?.precio ?? 0;
          const subtotal = precio * cp.cantidad * cantidad;
          acumuladoTotal += subtotal;
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

    const sumaPagos = (pagos as Array<{ monto: number }>).reduce(
      (acc, p) => acc + (typeof p.monto === "number" ? p.monto : 0),
      0
    );
    await prisma.venta.update({
      where: { id: venta.id },
      data: {
        total: acumuladoTotal,
        montoRecibido: sumaPagos,
      },
    });

    return NextResponse.json({ ok: true, ventaId: venta.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al registrar venta" },
      { status: 500 }
    );
  }
}
