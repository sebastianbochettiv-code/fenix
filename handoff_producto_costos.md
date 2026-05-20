# Handoff — Campos financieros Producto
**Fecha:** 2026-05-20  
**Estado:** INCOMPLETO — pendiente revertir y reimplementar vía sistema

---

## Qué se hizo (a revertir)

### 1. Campos creados vía SQL directo (MAL)
Se insertaron 5 registros en `core."fieldMetadata"` y columnas en la tabla del workspace usando SQL crudo. Esto funciona pero no es la vía correcta — el sistema de Twenty tiene su propia API de metadata.

**Campos creados (reconocibles por `createdAt` cercano a 2026-05-20 ~03:08):**
```sql
-- Verificar cuáles son:
SELECT id, name, type, "createdAt" FROM core."fieldMetadata"
WHERE "objectMetadataId" = '9c8840c9-145e-402a-b3ff-a0325d82b301'
  AND name IN ('cantidad','costoTotal','precioTotal','utilidad','utilidadPct');
```

**Para borrarlos:**
```sql
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
```

### 2. Sección COSTOS en ProductoClienteInstalacionCard (a revertir)
Archivo: `packages/twenty-front/src/modules/object-record/record-show/components/ProductoClienteInstalacionCard.tsx`

Se agregó una sección entera de costos con cálculo en tiempo real. Con los campos del sistema, eso es innecesario — Twenty lo muestra nativo en el panel "Fields". 

**El card debe quedar EXACTAMENTE como estaba antes** (solo los dos selects Cliente/Instalación):

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { SearchableSelect } from './SearchableSelect';

export const ProductoClienteInstalacionCard = ({ recordId }: { recordId: string }) => {
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedInstalacionId, setSelectedInstalacionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { updateOneRecord } = useUpdateOneRecord();

  const { records: productoRecords } = useFindManyRecords({
    objectNameSingular: 'producto',
    filter: { id: { eq: recordId } },
    recordGqlFields: { id: true, company: { id: true }, instalacion: { id: true } },
  } as any);
  const productoActual = (productoRecords as any[])[0];

  const { records: companies } = useFindManyRecords({ objectNameSingular: 'company' });
  const { records: instalaciones } = useFindManyRecords({
    objectNameSingular: 'instalacion',
    recordGqlFields: { id: true, name: true, company: { id: true } },
  } as any);

  useEffect(() => {
    if (productoActual) {
      setSelectedClienteId(productoActual.company?.id ?? '');
      setSelectedInstalacionId(productoActual.instalacion?.id ?? '');
    }
  }, [productoActual?.company?.id, productoActual?.instalacion?.id]);

  const clienteOptions = (companies as any[]).map((c: any) => ({ id: c.id, label: c.name }));

  const instalOptions = selectedClienteId
    ? (instalaciones as any[])
        .filter((i: any) => i.company?.id === selectedClienteId)
        .map((i: any) => ({ id: i.id, label: i.name }))
    : [];

  const saveToRecord = useCallback(async (companyId: string | null, instalacionId: string | null) => {
    setSaving(true);
    setSaved(false);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    await (updateOneRecord as any)({
      objectNameSingular: 'producto',
      idToUpdate: recordId,
      updateOneRecordInput: { companyId, instalacionId },
    });
    setSaving(false);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, [updateOneRecord, recordId]);

  const handleClienteChange = (id: string) => {
    setSelectedClienteId(id);
    setSelectedInstalacionId('');
    saveToRecord(id || null, null);
  };

  const handleInstalacionChange = (id: string) => {
    setSelectedInstalacionId(id);
    saveToRecord(selectedClienteId || null, id || null);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="mgc-presupuesto-card" onClick={stop}>
      <span className="mgc-direccion-label">Cliente e Instalación</span>
      <div className="mgc-pres-selects">
        <div className="mgc-pres-field">
          <label>Cliente</label>
          <SearchableSelect
            options={clienteOptions}
            value={selectedClienteId}
            onChange={handleClienteChange}
            placeholder="Buscar cliente..."
          />
        </div>
        <div className="mgc-pres-field">
          <label>Instalación</label>
          <SearchableSelect
            options={instalOptions}
            value={selectedInstalacionId}
            onChange={handleInstalacionChange}
            placeholder={selectedClienteId ? 'Buscar instalación...' : '— primero seleccioná un cliente —'}
            disabled={!selectedClienteId}
          />
        </div>
      </div>
      <div style={{ padding: '4px 16px 12px', minHeight: 20 }}>
        {saving && (
          <span style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', color: 'var(--twenty-font-color-light)' }}>
            Guardando...
          </span>
        )}
        {!saving && saved && (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#fff', background: '#22c55e', borderRadius: 6, padding: '2px 10px' }}>
            ✓ Guardado
          </span>
        )}
      </div>
    </div>
  );
};
```

---

## Qué hay que implementar (correctamente)

### Campos a crear vía API de metadata de Twenty

| Campo | Tipo | Editable | Fórmula |
|---|---|---|---|
| `cantidad` | NUMBER | ✅ sí | — |
| `costoTotal` | CURRENCY | ❌ (auto) | costoUnitario × cantidad |
| `precioTotal` | CURRENCY | ❌ (auto) | precioUnitario × cantidad |
| `utilidad` | CURRENCY | ❌ (auto) | precioTotal − costoTotal |
| `utilidadPct` | NUMBER | ❌ (auto) | utilidad / costoTotal × 100 |

### Cómo crear vía API metadata

**Endpoint:** `POST http://localhost:3100/metadata`  
**Auth:** Bearer token válido (ver paso 1)

**Paso 1 — Obtener token válido**

El token en `.mcp.json` expiró / es de una instancia anterior. Opciones:
- **A)** Ir a `http://localhost:3001` → Settings → API → crear nueva API key → copiar el token
- **B)** Usar el token de sesión corto que genera el frontend al loguearse (válido ~30 min, ver DevTools Network → cualquier request con Authorization Bearer)

**Paso 2 — Mutation para crear cada campo**

```graphql
mutation CreateField($input: CreateOneFieldMetadataInput!) {
  createOneField(input: $input) {
    id
    name
    type
    label
  }
}
```

Variables para `cantidad`:
```json
{
  "input": {
    "field": {
      "objectMetadataId": "9c8840c9-145e-402a-b3ff-a0325d82b301",
      "type": "NUMBER",
      "name": "cantidad",
      "label": "Cantidad",
      "icon": "IconHash",
      "isNullable": true
    }
  }
}
```

Variables para `costoTotal` (CURRENCY, read-only):
```json
{
  "input": {
    "field": {
      "objectMetadataId": "9c8840c9-145e-402a-b3ff-a0325d82b301",
      "type": "CURRENCY",
      "name": "costoTotal",
      "label": "Costo Total",
      "icon": "IconCurrencyDollar",
      "isNullable": true,
      "isUIReadOnly": true
    }
  }
}
```

Repetir para `precioTotal`, `utilidad` (ambos CURRENCY + `isUIReadOnly: true`) y `utilidadPct` (NUMBER + `isUIReadOnly: true`).

**Paso 3 — Hacer visibles los campos en la vista tabla**

Ir a `http://localhost:3001` → All Productos → Opciones → Fields → activar los 5 campos nuevos.

O vía API:
```graphql
mutation AddFieldToView($input: CreateOneViewFieldInput!) {
  createOneViewField(input: $input) {
    id
  }
}
```
Variables: `{ viewId: "c6908f7a-feb1-4486-8b8a-63dc1510ecb2", fieldMetadataId: "<ID del campo>", isVisible: true, size: 120, position: X }`

**Paso 4 — Workflow para auto-calcular**

Crear en la UI de Twenty (Workflows):
- Trigger: `producto.updated`
- Code step:
```js
const costo = workflowStep.payload.costoUnitario?.amountMicros ?? 0;
const precio = workflowStep.payload.precioUnitario?.amountMicros ?? 0;
const cantidad = workflowStep.payload.cantidad ?? 0;
const cc = workflowStep.payload.costoUnitario?.currencyCode ?? 'CLP';

const costoTotal = costo * cantidad;
const precioTotal = precio * cantidad;
const utilidad = precioTotal - costoTotal;
const utilidadPct = costoTotal > 0 ? Math.round((utilidad / costoTotal) * 10000) / 100 : 0;

return { costoTotal: { amountMicros: costoTotal, currencyCode: cc },
         precioTotal: { amountMicros: precioTotal, currencyCode: cc },
         utilidad: { amountMicros: utilidad, currencyCode: cc },
         utilidadPct };
```
- Update Record step: actualiza el producto con los 4 valores calculados

---

## Estado de la DB ahora

Los campos SQL-creados ESTÁN en la DB. El `docker restart` ya los registró en el sistema. 

Situación actual:
- ✅ Las columnas en `_producto` existen (no causan daño)
- ⚠️ Los `fieldMetadata` SQL-creados son campos funcionales pero sin pasar por el sistema
- ⚠️ El card muestra la sección COSTOS que habría que quitar

**Decisión:** Si los campos del sistema ya aparecen y funcionan en la UI de Twenty (Settings → Producto → Fields), puede que sea suficiente dejarlos y solo limpiar el card. Verificar primero antes de borrar y recrear.

---

## Archivos a modificar

| Archivo | Acción |
|---|---|
| `ProductoClienteInstalacionCard.tsx` | Revertir a versión sin sección COSTOS |
| `add_producto_costos.sql` | Eliminar (archivo temporal) |
| `handoff_producto_costos.md` | Este archivo — eliminar una vez resuelto |
