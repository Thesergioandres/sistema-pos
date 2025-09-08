import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

// GET: Obtener cliente por ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "clientes.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(id) },
  });
  if (!cliente)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

// PUT: Actualizar cliente
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "clientes.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const data = await req.json();
  const cliente = await prisma.cliente.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(cliente);
}

// DELETE: Eliminar cliente
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "clientes.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.cliente.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
