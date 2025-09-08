-- Enforce only one principal branch per business (negocio)
-- Partial unique index: only applies when isPrincipal = 1 and negocioId IS NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_principal_sucursal_por_negocio
ON "Sucursal"("negocioId")
WHERE "isPrincipal" = 1 AND "negocioId" IS NOT NULL;
