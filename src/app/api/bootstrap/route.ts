import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  interface BootstrapPayload {
    productos?: {
      id: number;
      nombre: string;
      tamanio: string;
      precio: number;
    }[];
    insumos?: {
      id: number;
      nombre: string;
      stock: number;
      unidad: string;
      proveedor: string | null;
      stockMinimo: number;
    }[];
    recetas?: {
      id: number;
      productoId: number;
      insumoId: number;
      cantidad: number;
    }[];
    combos?: {
      id: number;
      nombre: string;
      descripcion: string | null;
      precio: number;
      activo: boolean;
    }[];
    clientes?: { id: number; nombre: string }[];
    ventas?: {
      id: number;
      fecha: Date;
      usuarioId: number;
      sucursalId: number | null;
      clienteId: number | null;
      total: number;
      medioPago: string;
      montoRecibido: number | null;
      cambio: number | null;
      estado: string;
    }[];
    ventasPendientes?: {
      id: number;
      fecha: Date;
      total: number;
      pagado: number;
      saldo: number;
    }[];
    sucursales?: { id: number; nombre: string; direccion: string | null }[];
    usuarios?: {
      id: number;
      email: string;
      nombre: string;
      rol: string;
      sucursalId: number | null;
    }[];
    negocios?: unknown[];
  }
  const data: BootstrapPayload = {};

  // Catálogo
  const catPromises: Promise<void>[] = [];
  if (hasPermission(session, "catalogo.productos")) {
    catPromises.push(
      (async () => {
        const r = await prisma.producto.findMany({ orderBy: { id: "asc" } });
        data.productos = r.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          tamanio: p.tamanio,
          precio: p.precio,
        }));
      })()
    );
  }
  if (hasPermission(session, "catalogo.insumos")) {
    catPromises.push(
      (async () => {
        const r = await prisma.insumo.findMany({ orderBy: { id: "asc" } });
        data.insumos = r.map((i) => ({
          id: i.id,
          nombre: i.nombre,
          stock: i.stock,
          unidad: i.unidad,
          proveedor: i.proveedor,
          stockMinimo: i.stockMinimo,
        }));
      })()
    );
  }
  if (hasPermission(session, "catalogo.recetas")) {
    catPromises.push(
      (async () => {
        const r = await prisma.receta.findMany({ orderBy: { id: "asc" } });
        data.recetas = r.map((x) => ({
          id: x.id,
          productoId: x.productoId,
          insumoId: x.insumoId,
          cantidad: x.cantidad,
        }));
      })()
    );
  }
  if (hasPermission(session, "catalogo.combos")) {
    catPromises.push(
      (async () => {
        const r = await prisma.combo.findMany({ orderBy: { id: "asc" } });
        data.combos = r.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          descripcion: c.descripcion,
          precio: c.precio,
          activo: c.activo,
        }));
      })()
    );
  }

  // Clientes
  const cliPromise = hasPermission(session, "clientes.gestion")
    ? prisma.cliente
        .findMany({ orderBy: { id: "asc" } })
        .then((r) => (data.clientes = r))
    : Promise.resolve();

  // Ventas
  const ventasPromises: Promise<void>[] = [];
  if (hasPermission(session, "ventas.listado")) {
    ventasPromises.push(
      (async () => {
        const r = await prisma.venta.findMany({
          orderBy: { fecha: "desc" },
          take: 100,
        });
        data.ventas = r.map((v) => ({
          id: v.id,
          fecha: v.fecha,
          usuarioId: v.usuarioId,
          sucursalId: v.sucursalId ?? null,
          clienteId: v.clienteId ?? null,
          total: v.total,
          medioPago: v.medioPago,
          montoRecibido: v.montoRecibido ?? null,
          cambio: v.cambio ?? null,
          estado: v.estado,
        }));
      })()
    );
  }
  if (hasPermission(session, "ventas.pendientes")) {
    ventasPromises.push(
      prisma.venta
        .findMany({
          include: { pagos: true },
          orderBy: { fecha: "desc" },
          take: 200,
        })
        .then((ventas) => {
          const pendientes = ventas
            .map((v) => {
              const pagado = v.pagos.reduce((acc, p) => acc + p.monto, 0);
              const saldo = Math.max(0, v.total - pagado);
              return {
                id: v.id,
                fecha: v.fecha,
                total: v.total,
                pagado,
                saldo,
              };
            })
            .filter((x) => x.saldo > 0.001);
          data.ventasPendientes = pendientes;
        })
    );
  }

  // Sucursales y administración
  const adminPromises: Promise<void>[] = [];
  const canSuc =
    hasPermission(session, "sucursales.gestion") ||
    hasPermission(session, "usuarios.gestion");
  if (canSuc) {
    adminPromises.push(
      (async () => {
        const r = await prisma.sucursal.findMany({ orderBy: { id: "asc" } });
        data.sucursales = r.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          direccion: s.direccion ?? null,
        }));
      })()
    );
  }
  if (hasPermission(session, "usuarios.gestion")) {
    adminPromises.push(
      (async () => {
        const r = await prisma.usuario.findMany({ orderBy: { id: "asc" } });
        data.usuarios = r.map((u) => ({
          id: u.id,
          email: u.email,
          nombre: u.nombre,
          rol: u.rol,
          sucursalId: u.sucursalId ?? null,
        }));
      })()
    );
    // Negocios (usamos $queryRaw para evitar problemas de tipo en modelos extendidos)
    adminPromises.push(
      (async () => {
        const r = await prisma.$queryRawUnsafe(
          'SELECT * FROM "Negocio" ORDER BY id ASC'
        );
        data.negocios = r as unknown[];
      })()
    );
  }

  await Promise.allSettled([
    ...catPromises,
    cliPromise,
    ...ventasPromises,
    ...adminPromises,
  ]);

  return NextResponse.json(data);
}
