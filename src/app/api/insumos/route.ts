import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Selecciona explícitamente stockMinimo
  const insumos = await prisma.insumo.findMany({
    select: {
      id: true,
      nombre: true,
      stock: true,
      unidad: true,
      proveedor: true,
      stockMinimo: true,
    },
  });
  // Agrega el campo alertaStockBajo a cada insumo
  const insumosConAlerta = insumos.map(
    (i: {
      id: number;
      nombre: string;
      stock: number;
      unidad: string;
      proveedor: string | null;
      stockMinimo: number;
    }) => ({
      ...i,
      alertaStockBajo: i.stock <= i.stockMinimo,
    })
  );
  return NextResponse.json(insumosConAlerta);
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
  const { nombre, stock, unidad, proveedor, stockMinimo } = data;
  if (
    typeof nombre !== "string" ||
    nombre.length < 2 ||
    typeof stock !== "number" ||
    stock < 0 ||
    typeof unidad !== "string" ||
    unidad.length < 1 ||
    (proveedor && typeof proveedor !== "string") ||
    typeof stockMinimo !== "number" ||
    stockMinimo < 0
  ) {
    return NextResponse.json(
      { error: "Datos de insumo incompletos o inválidos" },
      { status: 400 }
    );
  }
  const nuevo = await prisma.insumo.create({ data });
  return NextResponse.json(nuevo);
}
