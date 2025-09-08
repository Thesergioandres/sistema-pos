import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";
import { logDebug, logInfo, logWarn, logError } from "@/lib/serverLog";

// GET: Listar sucursales (opcionalmente por negocioId)
export async function GET(request: Request) {
  logInfo("[GET /api/sucursales] inicio");
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    logWarn("[GET /api/sucursales] 401 sin sesión");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  // Filtro futuro
  void searchParams.get("negocioId");

  let sucursales: Array<
    Prisma.SucursalGetPayload<{
      include: {
        usuarios: {
          select: { id: true; nombre: true; email: true; rol: true };
        };
        ventas: { select: { id: true; fecha: true; total: true } };
      };
    }>
  >;

  if (
    hasPermission(session, "sucursales.gestion") ||
    hasPermission(session, "usuarios.gestion")
  ) {
    logDebug("[GET /api/sucursales] permisos elevados, listando todas");
    sucursales = await prisma.sucursal.findMany({
      include: {
        usuarios: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        ventas: { select: { id: true, fecha: true, total: true } },
      },
    });
  } else {
    // Devolver solo las sucursales asociadas al negocio donde es propietario o su sucursal asignada
    const ids: number[] = [];
    if (typeof session.user.sucursalId === "number")
      ids.push(session.user.sucursalId);
    try {
      const props = await (
        prisma as unknown as {
          negocioPropietario: {
            findMany: (args: {
              where: { usuarioId: number };
              select: { negocioId: true };
            }) => Promise<Array<{ negocioId: number }>>;
          };
        }
      ).negocioPropietario.findMany({
        where: { usuarioId: session.user.id },
        select: { negocioId: true },
      });
      const negocioIds = Array.isArray(props)
        ? props.map((p) => p.negocioId)
        : [];
      if (negocioIds.length > 0) {
        const delNegocio = await prisma.sucursal.findMany({
          where: { negocioId: { in: negocioIds } } as Prisma.SucursalWhereInput,
          include: {
            usuarios: {
              select: { id: true, nombre: true, email: true, rol: true },
            },
            ventas: { select: { id: true, fecha: true, total: true } },
          },
        });
        const set = new Map<number, (typeof delNegocio)[number]>();
        for (const s of delNegocio) set.set(s.id, s);
        if (ids.length) {
          const extra = await prisma.sucursal.findMany({
            where: { id: { in: ids.filter((id) => !set.has(id)) } },
            include: {
              usuarios: {
                select: { id: true, nombre: true, email: true, rol: true },
              },
              ventas: { select: { id: true, fecha: true, total: true } },
            },
          });
          for (const s of extra) set.set(s.id, s);
        }
        sucursales = Array.from(set.values());
      } else if (ids.length) {
        sucursales = await prisma.sucursal.findMany({
          where: { id: { in: ids } },
          include: {
            usuarios: {
              select: { id: true, nombre: true, email: true, rol: true },
            },
            ventas: { select: { id: true, fecha: true, total: true } },
          },
        });
      } else {
        sucursales = [];
      }
    } catch (e) {
      logError("[GET /api/sucursales] error consultando", e);
      sucursales = [];
    }
  }

  logInfo("[GET /api/sucursales] fin", { count: sucursales.length });
  return NextResponse.json(sucursales);
}

// POST: Crear una sucursal
export async function POST(request: Request) {
  logInfo("[POST /api/sucursales] inicio");
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    logWarn("[POST /api/sucursales] 401 sin sesión");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const data = await request.json();
  logDebug("[POST /api/sucursales] payload recibido", data);
  const { nombre, direccion } = data ?? {};

  // Aceptar negocioId como number o string numérica
  let negocioId: number | undefined = undefined;
  if (data && "negocioId" in data) {
    const v = (data as { negocioId?: unknown }).negocioId;
    if (typeof v === "number" && !Number.isNaN(v)) negocioId = v;
    else if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n)) negocioId = n;
    }
  }

  if (!nombre || typeof nombre !== "string") {
    logWarn("[POST /api/sucursales] 400 nombre requerido");
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  // Si no tiene permiso explícito, permitir si es propietario del negocio destino
  if (!hasPermission(session, "sucursales.gestion")) {
    logDebug(
      "[POST /api/sucursales] sin permiso sucursales.gestion, intentando autorizar por propiedad",
      { userId: session.user.id, negocioId }
    );
    // Si no vino negocioId, intentar resolverlo:
    if (typeof negocioId !== "number") {
      // 1) Si tiene usuarios.gestion y una sucursal activa, usar su negocio
      if (hasPermission(session, "usuarios.gestion")) {
        const sucId = (session.user as unknown as { sucursalId?: number })
          .sucursalId;
        if (typeof sucId === "number" && !Number.isNaN(sucId)) {
          type SucursalLite = { negocioId: number | null } | null;
          const suc = (await (
            prisma as unknown as {
              sucursal: {
                findUnique: (args: {
                  where: { id: number };
                }) => Promise<SucursalLite>;
              };
            }
          ).sucursal.findUnique({ where: { id: sucId } })) as SucursalLite;
          const nId =
            typeof suc?.negocioId === "number" ? suc?.negocioId : undefined;
          if (nId) {
            negocioId = nId;
            logDebug(
              "[POST /api/sucursales] negocioId inferido desde sucursal activa",
              { sucursalId: sucId, negocioId }
            );
          }
        }
      }
      // 2) Si sigue faltando, tomar el primer negocio donde sea propietario
      if (typeof negocioId !== "number") {
        const owned = await (
          prisma as unknown as {
            negocioPropietario: {
              findFirst: (args: {
                where: { usuarioId: number };
                select: { negocioId: true };
                orderBy?: { id: "asc" | "desc" };
              }) => Promise<{ negocioId: number } | null>;
            };
          }
        ).negocioPropietario.findFirst({
          where: { usuarioId: session.user.id },
          select: { negocioId: true },
          orderBy: { id: "asc" },
        });
        if (owned?.negocioId) {
          logDebug(
            "[POST /api/sucursales] asignado negocioId por propiedad",
            owned
          );
          negocioId = owned.negocioId;
        }
      }
    }
    if (typeof negocioId !== "number") {
      logWarn("[POST /api/sucursales] 403 faltó negocioId y no es propietario");
      return NextResponse.json(
        {
          error:
            "No autorizado: falta negocioId y no es propietario de ninguno",
        },
        { status: 403 }
      );
    }
    let isOwner = false;
    const owner = await (
      prisma as unknown as {
        negocioPropietario: {
          findFirst: (args: {
            where: { negocioId: number; usuarioId: number };
            select: { id: true };
          }) => Promise<{ id: number } | null>;
        };
      }
    ).negocioPropietario.findFirst({
      where: { negocioId, usuarioId: session.user.id },
      select: { id: true },
    });
    isOwner = Boolean(owner);
    // Fallback controlado: si no es propietario pero tiene usuarios.gestion,
    // permitir solo si su sucursal actual pertenece al mismo negocio
    if (!isOwner && hasPermission(session, "usuarios.gestion")) {
      logDebug(
        "[POST /api/sucursales] fallback usuarios.gestion, validando negocio de sucursal activa",
        {
          sucursalId: (session.user as unknown as { sucursalId?: number })
            .sucursalId,
        }
      );
      const sucId = (session.user as unknown as { sucursalId?: number })
        .sucursalId;
      if (typeof sucId === "number" && !Number.isNaN(sucId)) {
        type SucursalLite = { negocioId: number | null } | null;
        const suc = (await (
          prisma as unknown as {
            sucursal: {
              findUnique: (args: {
                where: { id: number };
              }) => Promise<SucursalLite>;
            };
          }
        ).sucursal.findUnique({ where: { id: sucId } })) as SucursalLite;
        const nId =
          typeof suc?.negocioId === "number" ? suc?.negocioId : undefined;
        if (nId && nId === negocioId) {
          logDebug(
            "[POST /api/sucursales] autorizado por pertenencia a mismo negocio",
            { negocioId: nId }
          );
          isOwner = true; // Autorizar por pertenencia operativa
        }
      }
    }
    if (!isOwner) {
      logWarn(
        "[POST /api/sucursales] 403 no es propietario del negocio indicado",
        { negocioId }
      );
      return NextResponse.json(
        { error: "No autorizado: no es propietario del negocio indicado" },
        { status: 403 }
      );
    }
  }

  // Si llega negocioId, marcar como principal si es la primera del negocio
  let isPrincipal = false;
  if (typeof negocioId === "number" && !Number.isNaN(negocioId)) {
    const where = { negocioId } as unknown as Prisma.SucursalWhereInput;
    const count = await prisma.sucursal.count({ where });
    isPrincipal = count === 0;
  }

  // Crear en transacción: si marcamos principal, desmarcar otras del negocio para mantener unicidad
  const nueva = await prisma.$transaction(async (tx) => {
    if (
      typeof negocioId === "number" &&
      !Number.isNaN(negocioId) &&
      isPrincipal
    ) {
      logDebug("[POST /api/sucursales] desmarcando anteriores principales", {
        negocioId,
      });
      await (
        tx as unknown as {
          sucursal: {
            updateMany: (args: {
              where: { negocioId: number };
              data: { isPrincipal: boolean };
            }) => Promise<{ count: number }>;
          };
        }
      ).sucursal.updateMany({
        where: { negocioId },
        data: { isPrincipal: false },
      });
    }
    const created = await tx.sucursal.create({
      data: {
        nombre: nombre.trim(),
        direccion: direccion ?? null,
        ...(typeof negocioId === "number" && !Number.isNaN(negocioId)
          ? { negocioId }
          : {}),
        ...(typeof negocioId === "number" && !Number.isNaN(negocioId)
          ? { isPrincipal }
          : {}),
      },
    });
    logInfo("[POST /api/sucursales] sucursal creada", {
      id: created.id,
      negocioId,
      isPrincipal,
    });
    return created;
  });

  logInfo("[POST /api/sucursales] fin", { id: nueva.id });
  return NextResponse.json(nueva);
}

// PUT: Editar una sucursal
export async function PUT(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "sucursales.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  const actualizada = await prisma.sucursal.update({
    where: { id: data.id },
    data: {
      nombre: data.nombre,
      direccion: data.direccion,
    },
  });
  return NextResponse.json(actualizada);
}

// DELETE: Eliminar una sucursal
export async function DELETE(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "sucursales.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  await prisma.sucursal.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
}
