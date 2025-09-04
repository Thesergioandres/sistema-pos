import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const { sucursalId } = await request.json();
  if (typeof sucursalId !== "number") {
    return NextResponse.json(
      { error: "ID de sucursal inválido" },
      { status: 400 }
    );
  }
  // Actualizar sucursalId del usuario
  await prisma.usuario.update({
    where: { id: userId },
    data: { sucursalId },
  });
  return NextResponse.json({ ok: true });
}
