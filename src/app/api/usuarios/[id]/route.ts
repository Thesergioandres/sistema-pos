import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(params.id) },
  });
  if (!usuario)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(usuario);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  // Si se va a actualizar la contraseña, hashearla
  if (data.password) {
    data.password = await hash(data.password, 10);
  } else {
    // Si password es vacío o no viene, no actualizar ese campo
    delete data.password;
  }
  const usuario = await prisma.usuario.update({
    where: { id: Number(params.id) },
    data,
  });
  return NextResponse.json(usuario);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.usuario.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
