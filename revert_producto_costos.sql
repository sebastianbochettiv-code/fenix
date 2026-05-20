SET search_path TO core;
DELETE FROM "fieldMetadata"
WHERE "objectMetadataId" = '9c8840c9-145e-402a-b3ff-a0325d82b301'
  AND name IN ('cantidad','costoTotal','precioTotal','utilidad','utilidadPct');

SET search_path TO workspace_63bqtyqydcd3janmojxik5kdj;
ALTER TABLE "_producto"
  DROP COLUMN IF EXISTS "cantidad",
  DROP COLUMN IF EXISTS "costoTotalAmountMicros",
  DROP COLUMN IF EXISTS "costoTotalCurrencyCode",
  DROP COLUMN IF EXISTS "precioTotalAmountMicros",
  DROP COLUMN IF EXISTS "precioTotalCurrencyCode",
  DROP COLUMN IF EXISTS "utilidadAmountMicros",
  DROP COLUMN IF EXISTS "utilidadCurrencyCode",
  DROP COLUMN IF EXISTS "utilidadPct";
