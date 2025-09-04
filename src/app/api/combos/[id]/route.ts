import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/combos/[id] - Obtiene un combo por ID
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const combo = await prisma.combo.findUnique({
    where: { id },
    include: {
      productos: {
        include: {
          producto: true,
        },
      },
    },
  });
  if (!combo)
    return NextResponse.json({ error: "Combo no encontrado" }, { status: 404 });
  return NextResponse.json(combo);
}

// PUT /api/combos/[id] - Actualiza un combo
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const data = await req.json();
  const { nombre, descripcion, precio, productos, activo } = data;
  // Actualiza datos básicos y reemplaza productos
  const combo = await prisma.combo.update({
    where: { id },
    data: {
      nombre,
      descripcion,
      precio,
      activo,
      productos: {
        deleteMany: {},
        create:
          productos?.map((p: { productoId: number; cantidad: number }) => ({
            productoId: p.productoId,
            cantidad: p.cantidad,
          })) || [],
      },
    },
    include: {
      productos: true,
    },
  });
  return NextResponse.json(combo);
}

// DELETE /api/combos/[id] - Elimina un combo
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  await prisma.combo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
