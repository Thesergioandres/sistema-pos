import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";

// POST /api/sucursales/[id]/principal
// Marca esta sucursal como principal. Si pertenece a un negocio, desmarca las demás.
export async function POST(
  _req: Request,
  // Use any to align with Next.js RouteContext variations across versions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { params }: any
) {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = (session as any)?.user;
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const suc = await tx.sucursal.findUnique({ where: { id } });
    if (!suc) {
      throw new Error("Sucursal no encontrada");
    }
    // Autorización: admin siempre; propietario del negocio también
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sucAny0 = suc as unknown as any;
    if (user.rol !== "admin") {
      if (
        typeof sucAny0.negocioId === "number" &&
        !Number.isNaN(sucAny0.negocioId)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txAnyAuth = tx as unknown as any;
        const owner = await txAnyAuth.negocioPropietario.findFirst({
          where: { negocioId: sucAny0.negocioId, usuarioId: user.id },
        });
        if (!owner) {
          throw new Error("FORBIDDEN");
        }
      } else {
        // si la sucursal no tiene negocio asociado, restringimos a admin
        throw new Error("FORBIDDEN");
      }
    }
    // Si tiene negocio, desmarcar otras como no principales
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sucAny = suc as unknown as any;
    if (
      typeof sucAny.negocioId === "number" &&
      !Number.isNaN(sucAny.negocioId)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txAny = tx as unknown as any;
      await txAny.sucursal.updateMany({
        where: { negocioId: sucAny.negocioId },
        data: { isPrincipal: false },
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txAny2 = tx as unknown as any;
    return txAny2.sucursal.update({
      where: { id },
      data: { isPrincipal: true },
    });
  });

  // Si la transacción lanzó FORBIDDEN, responder 403
  if ((updated as unknown as Error)?.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }
  return NextResponse.json(updated);
}
