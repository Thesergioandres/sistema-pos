-- CreateTable
CREATE TABLE "Negocio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NegocioPropietario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "negocioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NegocioPropietario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NegocioPropietario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sucursal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "negocioId" INTEGER,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Sucursal_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sucursal" ("direccion", "id", "nombre") SELECT "direccion", "id", "nombre" FROM "Sucursal";
DROP TABLE "Sucursal";
ALTER TABLE "new_Sucursal" RENAME TO "Sucursal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "NegocioPropietario_negocioId_usuarioId_key" ON "NegocioPropietario"("negocioId", "usuarioId");
