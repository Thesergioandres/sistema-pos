import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function POST() {
  const session = (await getServerSession(authOptions)) as Session | null;
  
  return NextResponse.json({
    hasSession: !!session,
    user: session?.user ? {
      id: session.user.id,
      rol: (session.user as unknown as { rol?: string }).rol,
      permisos: (session.user as unknown as { permisos?: Record<string, boolean> }).permisos,
    } : null,
    hasSucursalesPermission: hasPermission(session, "sucursales.gestion"),
    hasUsuariosPermission: hasPermission(session, "usuarios.gestion"),
  });
}