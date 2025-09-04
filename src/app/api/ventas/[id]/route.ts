import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const venta = await prisma.venta.findUnique({
    where: { id: Number(params.id) },
  });
  if (!venta)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(venta);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const venta = await prisma.venta.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(venta);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.venta.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
