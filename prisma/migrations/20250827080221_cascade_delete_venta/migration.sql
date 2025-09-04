-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VentaProducto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ventaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "VentaProducto_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VentaProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VentaProducto" ("cantidad", "id", "productoId", "subtotal", "ventaId") SELECT "cantidad", "id", "productoId", "subtotal", "ventaId" FROM "VentaProducto";
DROP TABLE "VentaProducto";
ALTER TABLE "new_VentaProducto" RENAME TO "VentaProducto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
