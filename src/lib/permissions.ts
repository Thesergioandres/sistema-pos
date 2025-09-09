import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function getSessionWithPerms(): Promise<Session | null> {
  const session = (await getServerSession(authOptions)) as Session | null;
  return session;
}

export function hasPermission(session: Session | null, key: string): boolean {
  if (!session?.user) return false;
  // Admin siempre permitido
  if ((session.user as unknown as { rol?: string }).rol === "admin") {
    return true;
  }
  const perms = (
    session.user as unknown as {
      permisos?: Record<string, boolean>;
    }
  ).permisos;
  return Boolean(perms && perms[key]);
}

export function hasAnyPermission(
  session: Session | null,
  keys: string[]
): boolean {
  return keys.some((k) => hasPermission(session, k));
}

// Helper para verificar permisos con bypass para primer usuario admin
export async function hasPermissionWithFirstUserBypass(
  session: Session | null, 
  key: string
): Promise<boolean> {
  if (!session?.user) return false;
  
  // Verificar permiso normal primero (incluye admin bypass existente)
  if (hasPermission(session, key)) {
    return true;
  }
  
  // Bypass adicional para el primer usuario admin durante setup inicial
  const totalUsuarios = await prisma.usuario.count();
  const isFirstUser = totalUsuarios === 1;
  const userRole = (session.user as unknown as { rol?: string }).rol;
  
  return isFirstUser && userRole === "admin";
}
