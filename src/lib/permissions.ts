import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";

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
