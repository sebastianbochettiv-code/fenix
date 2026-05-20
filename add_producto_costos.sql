-- Agregar campos financieros al objeto Producto
-- Producto objectMetadataId: 9c8840c9-145e-402a-b3ff-a0325d82b301
-- workspaceId: 66e86b6c-8565-4199-89c8-681d1423e267
-- applicationId: 36bb6e08-0163-4255-b78b-d400322d01d3

SET search_path TO core;

INSERT INTO "fieldMetadata" (
  id, "objectMetadataId", type, name, label, description, icon,
  "isCustom", "isActive", "isSystem", "isUIReadOnly", "isNullable",
  "workspaceId", "applicationId", "universalIdentifier",
  "createdAt", "updatedAt"
) VALUES
-- cantidad (editable por el usuario)
(
  gen_random_uuid(),
  '9c8840c9-145e-402a-b3ff-a0325d82b301',
  'NUMBER', 'cantidad', 'Cantidad', NULL, 'IconHash',
  true, true, false, false, true,
  '66e86b6c-8565-4199-89c8-681d1423e267',
  '36bb6e08-0163-4255-b78b-d400322d01d3',
  gen_random_uuid(), now(), now()
),
-- costoTotal (auto: costoUnitario × cantidad)
(
  gen_random_uuid(),
  '9c8840c9-145e-402a-b3ff-a0325d82b301',
  'CURRENCY', 'costoTotal', 'Costo Total', NULL, 'IconCurrencyDollar',
  true, true, false, true, true,
  '66e86b6c-8565-4199-89c8-681d1423e267',
  '36bb6e08-0163-4255-b78b-d400322d01d3',
  gen_random_uuid(), now(), now()
),
-- precioTotal (auto: precioUnitario × cantidad)
(
  gen_random_uuid(),
  '9c8840c9-145e-402a-b3ff-a0325d82b301',
  'CURRENCY', 'precioTotal', 'Precio Total', NULL, 'IconCurrencyDollar',
  true, true, false, true, true,
  '66e86b6c-8565-4199-89c8-681d1423e267',
  '36bb6e08-0163-4255-b78b-d400322d01d3',
  gen_random_uuid(), now(), now()
),
-- utilidad (auto: precioTotal − costoTotal)
(
  gen_random_uuid(),
  '9c8840c9-145e-402a-b3ff-a0325d82b301',
  'CURRENCY', 'utilidad', 'Utilidad', NULL, 'IconTrendingUp',
  true, true, false, true, true,
  '66e86b6c-8565-4199-89c8-681d1423e267',
  '36bb6e08-0163-4255-b78b-d400322d01d3',
  gen_random_uuid(), now(), now()
),
-- utilidadPct (auto: utilidad/costoTotal × 100)
(
  gen_random_uuid(),
  '9c8840c9-145e-402a-b3ff-a0325d82b301',
  'NUMBER', 'utilidadPct', 'Utilidad %', NULL, 'IconPercentage',
  true, true, false, true, true,
  '66e86b6c-8565-4199-89c8-681d1423e267',
  '36bb6e08-0163-4255-b78b-d400322d01d3',
  gen_random_uuid(), now(), now()
);

-- Agregar columnas a la tabla del workspace
SET search_path TO workspace_63bqtyqydcd3janmojxik5kdj;

ALTER TABLE "_producto"
  ADD COLUMN IF NOT EXISTS "cantidad"                  double precision,
  ADD COLUMN IF NOT EXISTS "costoTotalAmountMicros"    numeric,
  ADD COLUMN IF NOT EXISTS "costoTotalCurrencyCode"    text,
  ADD COLUMN IF NOT EXISTS "precioTotalAmountMicros"   numeric,
  ADD COLUMN IF NOT EXISTS "precioTotalCurrencyCode"   text,
  ADD COLUMN IF NOT EXISTS "utilidadAmountMicros"      numeric,
  ADD COLUMN IF NOT EXISTS "utilidadCurrencyCode"      text,
  ADD COLUMN IF NOT EXISTS "utilidadPct"               double precision;
