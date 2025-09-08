-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Insumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "stock" REAL NOT NULL,
    "unidad" TEXT NOT NULL,
    "proveedor" TEXT,
    "stockMinimo" REAL NOT NULL DEFAULT 4,
    "sucursalId" INTEGER,
    CONSTRAINT "Insumo_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Insumo" ("id", "nombre", "proveedor", "stock", "stockMinimo", "unidad") SELECT "id", "nombre", "proveedor", "stock", "stockMinimo", "unidad" FROM "Insumo";
DROP TABLE "Insumo";
ALTER TABLE "new_Insumo" RENAME TO "Insumo";
CREATE TABLE "new_Producto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tamanio" TEXT NOT NULL,
    "precio" REAL NOT NULL DEFAULT 0,
    "sucursalId" INTEGER,
    CONSTRAINT "Producto_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Producto" ("id", "nombre", "precio", "tamanio") SELECT "id", "nombre", "precio", "tamanio" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
