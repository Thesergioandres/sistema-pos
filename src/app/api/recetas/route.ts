import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const recetas = await prisma.receta.findMany();
  return NextResponse.json(recetas);
}

export async function POST(request: Request) {
  const data = await request.json();
  const nuevo = await prisma.receta.create({ data });
  return NextResponse.json(nuevo);
}
