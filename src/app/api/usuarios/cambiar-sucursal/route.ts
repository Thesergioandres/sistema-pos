import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logDebug, logInfo, logWarn } from "@/lib/serverLog";

export async function POST(request: Request) {
  logInfo("[POST /api/usuarios/cambiar-sucursal] inicio");
  const session = (await getServerSession(authOptions)) as Session | null;
  let userId: number | undefined = undefined;
  if (
    session?.user &&
    typeof session.user === "object" &&
    "id" in session.user
  ) {
    userId = (session.user as { id: number }).id;
  }
  if (!userId) {
    logWarn("[POST /api/usuarios/cambiar-sucursal] 401 sin sesión");
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { sucursalId } = await request.json();
  logDebug("[POST /api/usuarios/cambiar-sucursal] payload", { sucursalId });
  if (typeof sucursalId !== "number") {
    return NextResponse.json(
      { error: "ID de sucursal inválido" },
      { status: 400 }
    );
  }
  // Validaciones de autorización:
  // - Admin o usuarios.gestion: permitido
  // - Propietario del negocio de esa sucursal: permitido
  if (!hasPermission(session, "usuarios.gestion")) {
    logDebug(
      "[POST /api/usuarios/cambiar-sucursal] sin permiso usuarios.gestion, validando propiedad del negocio",
      { userId, sucursalId }
    );
    // Verificar si es propietario del negocio de la sucursal (tipos relax)
    const suc = await (
      prisma as unknown as {
        sucursal: {
          findUnique: (args: {
            where: { id: number };
            select: { negocioId: true };
          }) => Promise<{ negocioId: number | null } | null>;
        };
      }
    ).sucursal.findUnique({
      where: { id: sucursalId },
      select: { negocioId: true },
    });
    if (!suc) {
      logWarn("[POST /api/usuarios/cambiar-sucursal] sucursal no existe", {
        sucursalId,
      });
      return NextResponse.json(
        { error: "Sucursal no existe" },
        { status: 404 }
      );
    }
    const negocioId: number | null = (suc as { negocioId: number | null })
      .negocioId;
    if (negocioId != null) {
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
        where: { negocioId, usuarioId: userId },
        select: { id: true },
      });
      if (!owner) {
        logWarn(
          "[POST /api/usuarios/cambiar-sucursal] 403 no propietario del negocio",
          { negocioId, userId }
        );
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    } else {
      // Si la sucursal no está asociada a un negocio, permitir (caso legado)
    }
  }
  // Actualizar sucursalId del usuario
  await prisma.usuario.update({
    where: { id: userId },
    data: { sucursalId },
  });
  logInfo("[POST /api/usuarios/cambiar-sucursal] fin", { userId, sucursalId });
  return NextResponse.json({ ok: true });
}
