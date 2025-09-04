import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const producto = await prisma.producto.findUnique({
    where: { id: Number(params.id) },
  });
  if (!producto)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(producto);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  // Convertir precio a número para cumplir con el tipo Float de Prisma
  if (data.precio !== undefined) {
    data.precio = Number(data.precio);
  }
  const producto = await prisma.producto.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(producto);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.producto.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
