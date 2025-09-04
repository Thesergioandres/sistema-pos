import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const receta = await prisma.receta.findUnique({
    where: { id: Number(params.id) },
  });
  if (!receta)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(receta);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const receta = await prisma.receta.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(receta);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.receta.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
