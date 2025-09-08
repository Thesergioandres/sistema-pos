-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "sucursalId" INTEGER,
    "clienteId" INTEGER,
    "total" REAL NOT NULL,
    "medioPago" TEXT NOT NULL,
    "montoRecibido" REAL,
    "cambio" REAL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Venta" ("cambio", "clienteId", "fecha", "id", "medioPago", "montoRecibido", "sucursalId", "total", "usuarioId") SELECT "cambio", "clienteId", "fecha", "id", "medioPago", "montoRecibido", "sucursalId", "total", "usuarioId" FROM "Venta";
DROP TABLE "Venta";
ALTER TABLE "new_Venta" RENAME TO "Venta";
CREATE TABLE "new_VentaPago" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ventaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "ventaProductoId" INTEGER,
    CONSTRAINT "VentaPago_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VentaPago_ventaProductoId_fkey" FOREIGN KEY ("ventaProductoId") REFERENCES "VentaProducto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VentaPago" ("id", "monto", "tipo", "ventaId") SELECT "id", "monto", "tipo", "ventaId" FROM "VentaPago";
DROP TABLE "VentaPago";
ALTER TABLE "new_VentaPago" RENAME TO "VentaPago";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
