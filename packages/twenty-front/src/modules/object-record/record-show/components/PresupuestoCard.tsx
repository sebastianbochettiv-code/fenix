import { useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { ProductoPickerPopup } from './ProductoPickerPopup';
import { SearchableSelect } from './SearchableSelect';

type LineaItem = {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

export const PresupuestoCard = ({ recordId: _recordId }: { recordId: string }) => {
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedInstalacionId, setSelectedInstalacionId] = useState('');
  const [selectedContactoId, setSelectedContactoId] = useState('');
  const [lineas, setLineas] = useState<LineaItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const { records: companies } = useFindManyRecords({ objectNameSingular: 'company' });
  const { records: instalaciones } = useFindManyRecords({ objectNameSingular: 'instalacion' });
  const { records: personas } = useFindManyRecords({ objectNameSingular: 'person' });
  const { records: productos } = useFindManyRecords({ objectNameSingular: 'producto' });

  const clienteOptions = (companies as any[]).map((c) => ({ id: c.id, label: c.name }));

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

  const totalNeto = lineas.reduce((sum, l) => sum + l.subtotal, 0);
  const totalIVA = Math.round(totalNeto * 0.19);
  const totalBruto = totalNeto + totalIVA;

  const handleClienteChange = (id: string) => {
    setSelectedClienteId(id);
    setSelectedInstalacionId('');
    setSelectedContactoId('');
  };

  const addLinea = (linea: Omit<LineaItem, 'id'>) => {
    setLineas((prev) => [...prev, linea]);
  };

  const removeLinea = (idx: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== idx));
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="mgc-presupuesto-card">
      <span className="mgc-direccion-label">Presupuesto</span>

      {/* ── Selectores en cascada ── */}
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
            onChange={setSelectedInstalacionId}
            placeholder={selectedClienteId ? 'Buscar instalación...' : '— primero seleccioná un cliente —'}
            disabled={!selectedClienteId}
          />
        </div>

        <div className="mgc-pres-field">
          <label>Contacto</label>
          <SearchableSelect
            options={contactoOptions}
            value={selectedContactoId}
            onChange={setSelectedContactoId}
            placeholder={selectedClienteId ? 'Buscar contacto...' : '— primero seleccioná un cliente —'}
            disabled={!selectedClienteId}
          />
        </div>
      </div>

      {/* ── Tabla de líneas ── */}
      <div className="mgc-pres-tabla-header">
        <span>Producto</span>
        <span>Cant.</span>
        <span>P. Unit.</span>
        <span>Desc.%</span>
        <span>Subtotal</span>
        <span />
      </div>

      <div className="mgc-pres-tabla-body">
        {lineas.map((l, idx) => (
          <div key={idx} className="mgc-pres-tabla-row">
            <span title={l.descripcion}>{l.descripcion}</span>
            <span>{l.cantidad}</span>
            <span>{fmt(l.precioUnitario)}</span>
            <span>{l.descuento > 0 ? `${l.descuento}%` : '—'}</span>
            <span>{fmt(l.subtotal)}</span>
            <button
              className="mgc-pres-remove"
              onClick={(e) => { stop(e); removeLinea(idx); }}
            >
              ✕
            </button>
          </div>
        ))}
        {lineas.length === 0 && (
          <div className="mgc-pres-empty">Sin líneas — agregá productos</div>
        )}
      </div>

      <button
        className="mgc-pres-add-btn"
        onClick={(e) => { stop(e); setShowPicker(true); }}
      >
        + Agregar producto
      </button>

      {/* ── Totales ── */}
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

      <div style={{ opacity: 0.4, textAlign: 'center', padding: '8px 0', fontSize: 13, color: 'var(--twenty-font-color-light)' }}>
        Guardar — disponible cuando se conecte la base de datos
      </div>

      {showPicker && (
        <ProductoPickerPopup
          productos={productos as any[]}
          onConfirm={(linea) => { addLinea(linea); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
