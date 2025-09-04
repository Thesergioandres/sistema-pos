import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Guardar suscripción push
export async function POST(req: Request) {
  const data = await req.json();
  // data debe tener endpoint y keys
  if (!data.endpoint || !data.keys) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  // Evitar duplicados
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: data.endpoint },
  });
  if (existing) return NextResponse.json(existing);
  const sub = await prisma.pushSubscription.create({
    data: {
      endpoint: data.endpoint,
      keys: data.keys,
      clienteId: data.clienteId || null,
    },
  });
  return NextResponse.json(sub);
}
