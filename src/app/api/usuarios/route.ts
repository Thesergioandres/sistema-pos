import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";
import { hash } from "bcryptjs";

export async function GET(request: Request) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "usuarios.gestion")) {
    // Evitar 403 en UI que solo necesita nombres: devolver lista vacía
    return NextResponse.json([]);
  }
  const { searchParams } = new URL(request.url);
  const sucursalId = searchParams.get("sucursalId");
  const where = sucursalId ? { sucursalId: Number(sucursalId) } : {};
  const usuarios = await prisma.usuario.findMany({ where });
  return NextResponse.json(usuarios);
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
  // Permitir crear el primer usuario sin permisos
  const totalUsuarios = await prisma.usuario.count();
  let session: Session | null = null;
  if (totalUsuarios > 0) {
    session = (await getServerSession(authOptions)) as Session | null;
    if (!hasPermission(session, "usuarios.gestion")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
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
    const { nombre, email, password } = data;
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }
    // Validar email único
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      );
    }
    // Hash de contraseña
    const hashed = await hash(password, 10);
    const rol = totalUsuarios === 0 ? "admin" : "cajero";
    const nuevo = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashed,
        rol,
      },
    });
    return NextResponse.json({ ok: true, id: nuevo.id, rol });
  } catch {
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
