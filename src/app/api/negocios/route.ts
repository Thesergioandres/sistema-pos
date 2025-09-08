import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
// import { hasPermission } from "@/lib/permissions";
import { logDebug, logInfo, logWarn } from "@/lib/serverLog";

// GET: listar negocios (del propietario actual si hay)
export async function GET() {
  logInfo("[GET /api/negocios] inicio");
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user) {
    logWarn("[GET /api/negocios] 401 sin sesión");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  // Admin o usuarios.gestion pueden consultar; propietarios siempre pueden ver sus negocios
  const where = { propietarios: { some: { usuarioId: session.user.id } } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const negocios = await (prisma as unknown as any).negocio.findMany({
    where,
    include: {
      sucursales: true,
      propietarios: {
        include: {
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      },
    },
  });
  logInfo("[GET /api/negocios] fin", {
    count: Array.isArray(negocios) ? negocios.length : 0,
  });
  return NextResponse.json(negocios);
}

// POST: crear negocio y asignar propietario actual
export async function POST(request: Request) {
  logInfo("[POST /api/negocios] inicio");
  const session = (await getServerSession(authOptions)) as Session | null;
  // Permitir a cualquier usuario autenticado crear un negocio propio
  if (!session?.user) {
    logWarn("[POST /api/negocios] 401 sin sesión");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { nombre, descripcion } = await request.json();
  logDebug("[POST /api/negocios] payload", { nombre, descripcion });
  if (!nombre || typeof nombre !== "string")
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const negocio = await (prisma as unknown as any).negocio.create({
    data: { nombre: nombre.trim(), descripcion: descripcion ?? null },
  });
  if (session?.user?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as unknown as any).negocioPropietario.create({
      data: { negocioId: negocio.id, usuarioId: session.user.id },
    });
  }
  logInfo("[POST /api/negocios] fin", { id: negocio.id });
  return NextResponse.json(negocio);
}
