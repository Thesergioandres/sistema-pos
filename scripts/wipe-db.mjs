import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function wipe() {
  console.log("Wiping all data (keeping schema)...");
  // Desactivar FKs para SQLite
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");

  // Borrar en orden seguro respetando relaciones
  await prisma.ventaPago.deleteMany();
  await prisma.ventaProducto.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.receta.deleteMany();
  await prisma.comboProducto.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.insumo.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.negocioPropietario.deleteMany();
  await prisma.sucursal.deleteMany();
  await prisma.activeSession.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.negocio.deleteMany();

  // Re-activar FKs
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");

  console.log("Done. Database is empty.");
}

wipe()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
