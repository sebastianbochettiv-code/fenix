import { useCallback, useEffect, useRef, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(n));

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const toMicros = (clp: number) => Math.round(clp * 1_000_000);
const fromMicros = (micros: number | null | undefined) =>
  micros != null ? micros / 1_000_000 : 0;

const mkCLP = (clp: number) => ({ amountMicros: toMicros(clp), currencyCode: 'CLP' });

const calculos = (cu: number, pu: number, cant: number, tieneDesc: boolean, descPct: number) => {
  const descFactor = tieneDesc ? 1 - descPct / 100 : 1;
  const costoTotal = cu * cant;
  const precioTotal = pu * descFactor * cant;
  const margenPesos = precioTotal - costoTotal;
  const margenPorcentaje = costoTotal > 0 ? (margenPesos / costoTotal) * 100 : 0;
  return { costoTotal, precioTotal, margenPesos, margenPorcentaje };
};

const NumInput = ({
  label,
  value,
  onChange,
  onSave,
  width = 110,
  stop,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onSave: () => void;
  width?: number;
  stop: (e: React.SyntheticEvent) => void;
}) => (
  <div className="mgc-pres-field">
    <label>{label}</label>
    <input
      type="number"
      min="0"
      className="mgc-map-search-input"
      style={{ width }}
      value={value || ''}
      placeholder="0"
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      onBlur={onSave}
      onClick={stop}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') onSave(); }}
    />
  </div>
);

export const ProductoCostosCard = ({ recordId }: { recordId: string }) => {
  const [costoUnit, setCostoUnit] = useState(0);
  const [precioUnit, setPrecioUnit] = useState(0);
  const [cantidad, setCantidad] = useState(0);
  const [tieneDescuento, setTieneDescuento] = useState(false);
  const [descuentoPct, setDescuentoPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  const { updateOneRecord } = useUpdateOneRecord();

  const { records: productoRecords } = useFindManyRecords({
    objectNameSingular: 'producto',
    filter: { id: { eq: recordId } },
    recordGqlFields: {
      id: true,
      cantidad: true,
      tieneDescuento: true,
      descuentoPorcentaje: true,
      costoUnitario: { amountMicros: true, currencyCode: true },
      precioUnitario: { amountMicros: true, currencyCode: true },
    },
  } as any);
  const prod = (productoRecords as any[])[0];

  useEffect(() => {
    if (prod && !loaded.current) {
      setCostoUnit(fromMicros(prod.costoUnitario?.amountMicros));
      setPrecioUnit(fromMicros(prod.precioUnitario?.amountMicros));
      setCantidad(prod.cantidad ?? 0);
      setTieneDescuento(prod.tieneDescuento ?? false);
      setDescuentoPct(prod.descuentoPorcentaje ?? 0);
      loaded.current = true;
    }
  }, [prod]);

  const { costoTotal, precioTotal, margenPesos, margenPorcentaje } = calculos(
    costoUnit, precioUnit, cantidad, tieneDescuento, descuentoPct,
  );

  const saveAll = useCallback(
    async (cu: number, pu: number, cant: number, tDesc: boolean, descPct: number) => {
      const { costoTotal: ct, precioTotal: pt, margenPesos: mp, margenPorcentaje: mpct } =
        calculos(cu, pu, cant, tDesc, descPct);

      setSaving(true);
      setSaved(false);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      await (updateOneRecord as any)({
        objectNameSingular: 'producto',
        idToUpdate: recordId,
        updateOneRecordInput: {
          costoUnitario: mkCLP(cu),
          precioUnitario: mkCLP(pu),
          cantidad: cant,
          tieneDescuento: tDesc,
          descuentoPorcentaje: descPct,
          costoTotal: mkCLP(ct),
          precioTotal: mkCLP(pt),
          margenPesos: mkCLP(mp),
          margenPorcentaje: mpct,
        },
      });
      setSaving(false);
      setSaved(true);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    },
    [updateOneRecord, recordId],
  );

  const triggerSave = () => saveAll(costoUnit, precioUnit, cantidad, tieneDescuento, descuentoPct);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const margenColor = margenPesos >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div className="mgc-presupuesto-card" onClick={stop}>
      <span className="mgc-direccion-label">Costos y Márgenes</span>

      <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <NumInput label="Costo Unit." value={costoUnit} onChange={setCostoUnit} onSave={triggerSave} stop={stop} />
        <NumInput label="Precio Unit." value={precioUnit} onChange={setPrecioUnit} onSave={triggerSave} stop={stop} />
        <NumInput label="Cantidad" value={cantidad} onChange={setCantidad} onSave={triggerSave} stop={stop} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={tieneDescuento}
              onChange={(e) => {
                const v = e.target.checked;
                setTieneDescuento(v);
                saveAll(costoUnit, precioUnit, cantidad, v, descuentoPct);
              }}
              onClick={stop}
            />
            Descuento
          </label>

          {tieneDescuento && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                min="0"
                max="100"
                className="mgc-map-search-input"
                style={{ width: 70 }}
                value={descuentoPct || ''}
                placeholder="0"
                onChange={(e) => setDescuentoPct(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                onBlur={triggerSave}
                onClick={stop}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') triggerSave(); }}
              />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>%</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '4px 16px', minHeight: 22 }}>
        {saving && (
          <span style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.5, color: 'var(--t-font-color-light)' }}>
            Guardando...
          </span>
        )}
        {!saving && saved && (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#fff', background: '#22c55e', borderRadius: 6, padding: '2px 10px' }}>
            ✓ Guardado
          </span>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '0 16px' }} />
      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'Costo Total', value: fmt(costoTotal) },
          { label: tieneDescuento ? `Precio Total (−${descuentoPct}%)` : 'Precio Total', value: fmt(precioTotal) },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            <span style={{ color: 'var(--t-font-color-primary)' }}>{value}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Margen</span>
          <span style={{ color: margenColor }}>
            {fmt(margenPesos)} &nbsp;
            <span style={{ fontSize: 12, fontWeight: 400 }}>({fmtPct(margenPorcentaje)})</span>
          </span>
        </div>
      </div>
    </div>
  );
};
