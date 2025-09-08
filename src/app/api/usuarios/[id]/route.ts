import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "usuarios.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) },
  });
  if (!usuario)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(usuario);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "usuarios.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const data = await request.json();
  // Sanear campo permisos si viene
  if (data.permisos && typeof data.permisos !== "object") {
    delete data.permisos;
  }
  // Si se va a actualizar la contraseña, hashearla
  if (data.password) {
    data.password = await hash(data.password, 10);
  } else {
    // Si password es vacío o no viene, no actualizar ese campo
    delete data.password;
  }
  const usuario = await prisma.usuario.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(usuario);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "usuarios.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.usuario.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
