import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import { hasPermission } from "@/lib/permissions";
import type { Session } from "next-auth";

export async function GET(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (
    !hasPermission(session, "catalogo.productos") &&
    session?.user?.rol !== "admin"
  ) {
    return NextResponse.json([]);
  }
  const { searchParams } = new URL(request.url);
  const sucursalIdParam = searchParams.get("sucursalId");
  const negocioIdParam = searchParams.get("negocioId");
  let where: Prisma.ProductoWhereInput | undefined = undefined;
  if (sucursalIdParam) {
    const n = Number(sucursalIdParam);
    if (!Number.isNaN(n))
      where = { sucursalId: n } as unknown as Prisma.ProductoWhereInput;
  } else if (negocioIdParam) {
    const n = Number(negocioIdParam);
    if (!Number.isNaN(n)) {
      where = {
        sucursal: { is: { negocioId: n } },
      } as unknown as Prisma.ProductoWhereInput;
    }
  }
  const productos = await prisma.producto.findMany({ where });
  return NextResponse.json(productos);
}

// Simple rate limiting (memory, por IP)
const rateLimitMap = new Map<string, { count: number; last: number }>();
const RATE_LIMIT = 10; // 10 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.last > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, last: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  entry.last = now;
  return true;
}

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.productos")) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }
  // Rate limiting por IP
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones, intenta más tarde." },
      { status: 429 }
    );
  }
  let data;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  // Validación estricta de tipos y campos obligatorios
  const { nombre, precio } = data;
  if (
    typeof nombre !== "string" ||
    nombre.length < 2 ||
    typeof precio !== "number" ||
    precio <= 0
  ) {
    return NextResponse.json(
      { error: "Datos de producto incompletos o inválidos" },
      { status: 400 }
    );
  }
  const nuevo = await prisma.producto.create({ data });
  return NextResponse.json(nuevo);
}
