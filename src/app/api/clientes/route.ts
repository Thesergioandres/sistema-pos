import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Listar clientes
export async function GET() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
  });
  return NextResponse.json(clientes);
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

// POST: Crear cliente
export async function POST(req: Request) {
  // Rate limiting por IP
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas peticiones, intenta más tarde." },
      { status: 429 }
    );
  }
  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  // Validación estricta de tipos y campos obligatorios
  const { nombre, email, telefono } = data;
  if (typeof nombre !== "string" || nombre.length < 2) {
    return NextResponse.json(
      { error: "Nombre de cliente inválido" },
      { status: 400 }
    );
  }
  if (email && typeof email !== "string") {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (telefono && typeof telefono !== "string") {
    return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
  }
  const cliente = await prisma.cliente.create({ data });
  return NextResponse.json(cliente);
}
