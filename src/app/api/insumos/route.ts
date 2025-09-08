import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import { hasPermission } from "@/lib/permissions";
import type { Session } from "next-auth";

export async function GET(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.insumos")) {
    // Evitar 403 que rompan UI: devolver lista vacía
    return NextResponse.json([]);
  }
  try {
    // Parámetro opcional (placeholder para futuros filtros por sucursal)
    const { searchParams } = new URL(request.url);
    const sucursalIdParam = searchParams.get("sucursalId");
    const negocioIdParam = searchParams.get("negocioId");
    let where: Prisma.InsumoWhereInput | undefined = undefined;
    if (sucursalIdParam) {
      const n = Number(sucursalIdParam);
      if (!Number.isNaN(n))
        where = { sucursalId: n } as unknown as Prisma.InsumoWhereInput;
    } else if (negocioIdParam) {
      const n = Number(negocioIdParam);
      if (!Number.isNaN(n)) {
        where = {
          sucursal: { is: { negocioId: n } },
        } as unknown as Prisma.InsumoWhereInput;
      }
    }

    const insumos = await prisma.insumo.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        stock: true,
        unidad: true,
        proveedor: true,
        stockMinimo: true,
      },
    });
    const insumosConAlerta = insumos.map((i) => ({
      ...i,
      alertaStockBajo: i.stock <= i.stockMinimo,
    }));
    return NextResponse.json(insumosConAlerta);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al listar" },
      { status: 500 }
    );
  }
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
  if (!hasPermission(session, "catalogo.insumos")) {
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
  try {
    const data = await request.json();
    const { nombre, stock, unidad, proveedor, stockMinimo } = data ?? {};
    // Validación estricta de tipos y campos obligatorios
    if (
      typeof nombre !== "string" ||
      nombre.trim().length < 2 ||
      typeof stock !== "number" ||
      stock < 0 ||
      typeof unidad !== "string" ||
      unidad.trim().length < 1 ||
      (proveedor !== undefined &&
        proveedor !== null &&
        typeof proveedor !== "string") ||
      typeof stockMinimo !== "number" ||
      stockMinimo < 0
    ) {
      return NextResponse.json(
        { error: "Datos de insumo incompletos o inválidos" },
        { status: 400 }
      );
    }
    const nuevo = await prisma.insumo.create({
      data: {
        nombre: nombre.trim(),
        stock,
        unidad: unidad.trim(),
        proveedor: proveedor ? proveedor.trim() : null,
        stockMinimo,
      },
    });
    return NextResponse.json(nuevo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al crear" },
      { status: 500 }
    );
  }
}
