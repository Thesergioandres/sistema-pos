-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Insumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "stock" REAL NOT NULL,
    "unidad" TEXT NOT NULL,
    "proveedor" TEXT,
    "stockMinimo" REAL NOT NULL DEFAULT 4
);
INSERT INTO "new_Insumo" ("id", "nombre", "proveedor", "stock", "unidad") SELECT "id", "nombre", "proveedor", "stock", "unidad" FROM "Insumo";
DROP TABLE "Insumo";
ALTER TABLE "new_Insumo" RENAME TO "Insumo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
