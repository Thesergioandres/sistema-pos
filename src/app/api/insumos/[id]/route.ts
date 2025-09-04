import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const insumo = await prisma.insumo.findUnique({
    where: { id: Number(params.id) },
  });
  if (!insumo)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(insumo);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const insumo = await prisma.insumo.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(insumo);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.insumo.delete({
    where: { id: Number(params.id) },
  });
  return NextResponse.json({ ok: true });
}
