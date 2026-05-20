import { useCallback, useEffect, useRef, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { ProductoPickerPopup } from './ProductoPickerPopup';
import { SearchableSelect } from './SearchableSelect';

type LineaItem = {
  productoId: string;
  descripcion: string;
  precioUnitario: number;
  descuento: number;
  tieneDescuento: boolean;
  subtotal: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

const fromMicros = (micros: number | null | undefined) =>
  micros != null ? micros / 1_000_000 : 0;

export const PresupuestoCard = ({ recordId }: { recordId: string }) => {
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedInstalacionId, setSelectedInstalacionId] = useState('');
  const [selectedContactoId, setSelectedContactoId] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  const { updateOneRecord } = useUpdateOneRecord();

  // ── Cargar presupuesto actual ──
  const { records: presupuestoRecords } = useFindManyRecords({
    objectNameSingular: 'presupuesto',
    filter: { id: { eq: recordId } },
    recordGqlFields: { id: true, company: { id: true }, instalacion: { id: true }, person: { id: true } },
  } as any);
  const presupuestoActual = (presupuestoRecords as any[])[0];

  // ── Cargar productos asignados a este presupuesto ──
  const { records: productosAsignados } = useFindManyRecords({
    objectNameSingular: 'producto',
    filter: { productosId: { eq: recordId } },
    recordGqlFields: {
      id: true,
      name: true,
      precioUnitario: { amountMicros: true, currencyCode: true },
      tieneDescuento: true,
      descuentoPorcentaje: true,
    },
  } as any);

  useEffect(() => {
    if (presupuestoActual && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (presupuestoActual.company?.id) setSelectedClienteId(presupuestoActual.company.id);
      if (presupuestoActual.instalacion?.id) setSelectedInstalacionId(presupuestoActual.instalacion.id);
      if (presupuestoActual.person?.id) setSelectedContactoId(presupuestoActual.person.id);
    }
  }, [presupuestoActual]);

  const flashSaved = useCallback(() => {
    setSaving(false);
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  const saveFields = useCallback((fields: Record<string, string | null>) => {
    setSaving(true);
    setSaved(false);
    (updateOneRecord as any)({
      objectNameSingular: 'presupuesto',
      idToUpdate: recordId,
      updateOneRecordInput: fields,
    }).then(flashSaved).catch(flashSaved);
  }, [updateOneRecord, recordId, flashSaved]);

  const { records: companies } = useFindManyRecords({ objectNameSingular: 'company' });
  const { records: instalaciones } = useFindManyRecords({
    objectNameSingular: 'instalacion',
    recordGqlFields: { id: true, name: true, company: { id: true } },
  } as any);
  const { records: personas } = useFindManyRecords({
    objectNameSingular: 'person',
    recordGqlFields: { id: true, name: { firstName: true, lastName: true }, company: { id: true } },
  } as any);
  const { records: todosProductos } = useFindManyRecords({
    objectNameSingular: 'producto',
    recordGqlFields: {
      id: true,
      name: true,
      precioUnitario: { amountMicros: true, currencyCode: true },
      tieneDescuento: true,
      descuentoPorcentaje: true,
      company: { id: true },
    },
  } as any);

  const clienteOptions = (companies as any[]).map((c) => ({ id: c.id, label: c.name }));

  // Catálogo libre: productos sin empresa asignada, siempre disponibles
  const productosFiltrados = (todosProductos as any[]).filter((p) => !p.company?.id);

  const instalOptions = selectedClienteId
    ? (instalaciones as any[])
        .filter((i) => i.company?.id === selectedClienteId)
        .map((i) => ({ id: i.id, label: i.name }))
    : [];

  const contactoOptions = selectedClienteId
    ? (personas as any[])
        .filter((p) => p.company?.id === selectedClienteId)
        .map((p) => {
          const fn = p.name?.firstName ?? '';
          const ln = p.name?.lastName ?? '';
          return { id: p.id, label: `${fn} ${ln}`.trim() || p.id };
        })
    : [];

  // ── Construir lineas desde productos asignados ──
  const lineas: LineaItem[] = (productosAsignados as any[]).map((p) => {
    const precio = fromMicros(p.precioUnitario?.amountMicros);
    const tieneDesc = p.tieneDescuento ?? false;
    const desc = tieneDesc ? (p.descuentoPorcentaje ?? 0) : 0;
    return {
      productoId: p.id,
      descripcion: p.name,
      precioUnitario: precio,
      descuento: desc,
      tieneDescuento: tieneDesc,
      subtotal: Math.round(precio * (1 - desc / 100)),
    };
  });

  const totalNeto = lineas.reduce((sum, l) => sum + l.subtotal, 0);
  const totalIVA = Math.round(totalNeto * 0.19);
  const totalBruto = totalNeto + totalIVA;

  const handleClienteChange = (id: string) => {
    setSelectedClienteId(id);
    setSelectedInstalacionId('');
    setSelectedContactoId('');
    saveFields({ companyId: id || null, instalacionId: null, personId: null });
  };

  const handleInstalacionChange = (id: string) => {
    setSelectedInstalacionId(id);
    saveFields({ instalacionId: id || null });
  };

  const handleContactoChange = (id: string) => {
    setSelectedContactoId(id);
    saveFields({ personId: id || null });
  };

  const addProducto = (productoId: string) => {
    setSaving(true);
    setSaved(false);
    (updateOneRecord as any)({
      objectNameSingular: 'producto',
      idToUpdate: productoId,
      updateOneRecordInput: {
        productosId: recordId,
        companyId: selectedClienteId,
        instalacionId: selectedInstalacionId,
      },
    }).then(flashSaved).catch(flashSaved);
  };

  const removeProducto = (productoId: string) => {
    (updateOneRecord as any)({
      objectNameSingular: 'producto',
      idToUpdate: productoId,
      updateOneRecordInput: { productosId: null, companyId: null, instalacionId: null },
    });
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="mgc-presupuesto-card">
      <span className="mgc-direccion-label">Presupuesto</span>

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
        <div className="mgc-pres-field">
          <label>Contacto</label>
          <SearchableSelect
            options={contactoOptions}
            value={selectedContactoId}
            onChange={handleContactoChange}
            placeholder={selectedClienteId ? 'Buscar contacto...' : '— primero seleccioná un cliente —'}
            disabled={!selectedClienteId}
          />
        </div>
      </div>

      <div style={{ padding: '0 16px 4px', minHeight: 22 }}>
        {saving && <span style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.5, color: 'var(--t-font-color-light)' }}>Guardando...</span>}
        {!saving && saved && <span style={{ fontSize: 12, fontStyle: 'italic', color: '#fff', background: '#22c55e', borderRadius: 6, padding: '2px 10px' }}>✓ Guardado</span>}
      </div>

      <div className="mgc-pres-tabla-header">
        <span>Producto</span>
        <span>P. Unit.</span>
        <span>Desc.%</span>
        <span>Subtotal</span>
        <span />
      </div>

      <div className="mgc-pres-tabla-body">
        {lineas.map((l) => (
          <div key={l.productoId} className="mgc-pres-tabla-row">
            <span title={l.descripcion}>{l.descripcion}</span>
            <span>{fmt(l.precioUnitario)}</span>
            <span>{l.tieneDescuento ? `${l.descuento}%` : '—'}</span>
            <span>{fmt(l.subtotal)}</span>
            <button
              className="mgc-pres-remove"
              onClick={(e) => { stop(e); removeProducto(l.productoId); }}
            >
              ✕
            </button>
          </div>
        ))}
        {lineas.length === 0 && (
          <div className="mgc-pres-empty">Sin productos — agregá usando el botón</div>
        )}
      </div>

      <button
        className="mgc-pres-add-btn"
        disabled={!selectedClienteId || !selectedInstalacionId}
        title={!selectedClienteId || !selectedInstalacionId ? 'Seleccioná cliente e instalación primero' : undefined}
        onClick={(e) => { stop(e); setShowPicker(true); }}
      >
        + Agregar producto
      </button>

      <div className="mgc-pres-totales">
        <div className="mgc-pres-total-row">
          <span>Neto</span><span>{fmt(totalNeto)}</span>
        </div>
        <div className="mgc-pres-total-row">
          <span>IVA 19%</span><span>{fmt(totalIVA)}</span>
        </div>
        <div className="mgc-pres-total-row mgc-pres-total-bruto">
          <span>Total</span><span>{fmt(totalBruto)}</span>
        </div>
      </div>

      {showPicker && (
        <ProductoPickerPopup
          productos={productosFiltrados}
          onConfirm={(productoId) => { addProducto(productoId); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
