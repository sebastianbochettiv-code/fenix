import { useState } from 'react';
import { SearchableSelect } from './SearchableSelect';

type LineaItem = {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tieneDescuento: boolean;
  subtotal: number;
};

type Props = {
  productos: any[];
  onConfirm: (linea: LineaItem) => void;
  onClose: () => void;
};

const fromMicros = (micros: number | null | undefined) =>
  micros != null ? micros / 1_000_000 : 0;

export const ProductoPickerPopup = ({ productos, onConfirm, onClose }: Props) => {
  const [selectedId, setSelectedId] = useState('');

  const options = productos.map((p: any) => ({ id: p.id, label: p.name }));
  const seleccionado = productos.find((p: any) => p.id === selectedId);

  const handleConfirm = () => {
    if (!seleccionado) return;
    const precio = fromMicros(seleccionado.precioUnitario?.amountMicros);
    const tieneDescuento = seleccionado.tieneDescuento ?? false;
    const descuento = tieneDescuento ? (seleccionado.descuentoPorcentaje ?? 0) : 0;
    onConfirm({
      productoId: seleccionado.id,
      descripcion: seleccionado.name,
      cantidad: 1,
      precioUnitario: precio,
      descuento,
      tieneDescuento,
      subtotal: Math.round(precio * (1 - descuento / 100)),
    });
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="mgc-popup-overlay" onClick={stop}>
      <div className="mgc-popup-box" onClick={stop}>
        <div className="mgc-popup-header">
          <span>Agregar producto</span>
          <button className="mgc-popup-close" onClick={(e) => { stop(e); onClose(); }}>✕</button>
        </div>

        <div style={{ padding: '12px 16px 8px' }}>
          <SearchableSelect
            options={options}
            value={selectedId}
            onChange={setSelectedId}
            placeholder={options.length ? 'Seleccionar producto...' : 'Sin productos para este cliente e instalación'}
            disabled={options.length === 0}
          />
          {options.length === 0 && (
            <div className="mgc-popup-empty" style={{ marginTop: 8 }}>
              Vinculá productos a este cliente e instalación primero
            </div>
          )}
        </div>

        <div className="mgc-popup-actions">
          <button className="mgc-popup-cancel" onClick={(e) => { stop(e); onClose(); }}>
            Cancelar
          </button>
          <button
            className="mgc-popup-confirm"
            disabled={!seleccionado}
            onClick={(e) => { stop(e); handleConfirm(); }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};
