import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/combos - Lista todos los combos
export async function GET() {
  const combos = await prisma.combo.findMany({
    include: {
      productos: {
        include: {
          producto: true,
        },
      },
    },
  });
  return NextResponse.json(combos);
}

// POST /api/combos - Crea un nuevo combo
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { nombre, descripcion, precio, productos, activo } = data;
  // productos: [{ productoId, cantidad }]
  interface ProductoInput {
    productoId: number;
    cantidad: number;
  }

  const combo = await prisma.combo.create({
    data: {
      nombre,
      descripcion,
      precio,
      activo: activo ?? true,
      productos: {
        create:
          (productos as ProductoInput[] | undefined)?.map(
            (p: ProductoInput) => ({
              productoId: p.productoId,
              cantidad: p.cantidad,
            })
          ) || [],
      },
    },
    include: {
      productos: true,
    },
  });
  return NextResponse.json(combo);
}
