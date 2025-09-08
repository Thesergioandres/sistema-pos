import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.productos")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const producto = await prisma.producto.findUnique({
    where: { id: Number(id) },
  });
  if (!producto)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(producto);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.productos")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const data = await request.json();
  // Convertir precio a número para cumplir con el tipo Float de Prisma
  if (data.precio !== undefined) {
    data.precio = Number(data.precio);
  }
  const producto = await prisma.producto.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(producto);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.productos")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.producto.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
