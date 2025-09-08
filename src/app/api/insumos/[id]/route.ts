import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import authOptions from "@/pages/api/auth/[...nextauth]";
import type { Session } from "next-auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.insumos")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const insumo = await prisma.insumo.findUnique({ where: { id } });
    if (!insumo)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(insumo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al obtener" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.insumos")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const data = await request.json();
    const { nombre, stock, unidad, proveedor, stockMinimo } = data ?? {};
    if (
      (nombre !== undefined && typeof nombre !== "string") ||
      (stock !== undefined && typeof stock !== "number") ||
      (unidad !== undefined && typeof unidad !== "string") ||
      (proveedor !== undefined &&
        proveedor !== null &&
        typeof proveedor !== "string") ||
      (stockMinimo !== undefined && typeof stockMinimo !== "number")
    ) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const insumo = await prisma.insumo.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: nombre.trim() } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(unidad !== undefined ? { unidad: unidad.trim() } : {}),
        ...(stockMinimo !== undefined ? { stockMinimo } : {}),
        ...(proveedor !== undefined
          ? { proveedor: proveedor ? proveedor.trim() : null }
          : {}),
      },
    });
    return NextResponse.json(insumo);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al actualizar" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!hasPermission(session, "catalogo.insumos")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    await prisma.insumo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: msg || "Error al eliminar" },
      { status: 500 }
    );
  }
}
