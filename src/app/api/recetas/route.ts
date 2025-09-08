import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import { hasPermission } from "@/lib/permissions";
import type { Session } from "next-auth";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.recetas")) {
    // Evitar 403 que rompan listados: devolver lista vacía
    return NextResponse.json([]);
  }
  const recetas = await prisma.receta.findMany();
  return NextResponse.json(recetas);
}

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.recetas")) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }
  const data = await request.json();
  const nuevo = await prisma.receta.create({ data });
  return NextResponse.json(nuevo);
}
