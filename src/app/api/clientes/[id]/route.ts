import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener cliente por ID
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(params.id) },
  });
  if (!cliente)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

// PUT: Actualizar cliente
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const data = await req.json();
  const cliente = await prisma.cliente.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(cliente);
}

// DELETE: Eliminar cliente
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.cliente.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
