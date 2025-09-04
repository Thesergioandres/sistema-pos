import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Listar todas las sucursales
export async function GET() {
  const sucursales = await prisma.sucursal.findMany({
    include: {
      usuarios: { select: { id: true, nombre: true, email: true, rol: true } },
      ventas: { select: { id: true, fecha: true, total: true } },
    },
  });
  return NextResponse.json(sucursales);
}

// POST: Crear una sucursal
export async function POST(request: Request) {
  const data = await request.json();
  const nueva = await prisma.sucursal.create({
    data: {
      nombre: data.nombre,
      direccion: data.direccion,
    },
  });
  return NextResponse.json(nueva);
}

// PUT: Editar una sucursal
export async function PUT(request: Request) {
  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  const actualizada = await prisma.sucursal.update({
    where: { id: data.id },
    data: {
      nombre: data.nombre,
      direccion: data.direccion,
    },
  });
  return NextResponse.json(actualizada);
}

// DELETE: Eliminar una sucursal
export async function DELETE(request: Request) {
  const data = await request.json();
  if (!data.id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }
  await prisma.sucursal.delete({ where: { id: data.id } });
  return NextResponse.json({ ok: true });
}
