import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

// GET /api/sucursales/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "sucursales.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const sucursal = await prisma.sucursal.findUnique({
    where: { id },
    include: {
      usuarios: { select: { id: true, nombre: true, email: true, rol: true } },
      ventas: { select: { id: true, fecha: true, total: true } },
    },
  });
  if (!sucursal)
    return NextResponse.json(
      { error: "Sucursal no encontrada" },
      { status: 404 }
    );
  return NextResponse.json(sucursal);
}

// DELETE /api/sucursales/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "sucursales.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  await prisma.sucursal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PUT /api/sucursales/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "sucursales.gestion")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (isNaN(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const data = await req.json();
  const actualizada = await prisma.sucursal.update({
    where: { id },
    data: {
      nombre: data.nombre,
      direccion: data.direccion,
    },
  });
  return NextResponse.json(actualizada);
}
