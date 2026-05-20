import { useState } from 'react';

type LineaItem = {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
};

type Props = {
  productos: any[];
  onConfirm: (linea: LineaItem) => void;
  onClose: () => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

export const ProductoPickerPopup = ({ productos, onConfirm, onClose }: Props) => {
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<any>(null);
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(0);
  const [descuento, setDescuento] = useState(0);

  const filtrados = busqueda.trim()
    ? productos.filter((p: any) =>
        p.name?.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : productos;

  const subtotal = Math.round(precio * cantidad * (1 - descuento / 100));

  const handleSeleccionar = (p: any) => {
    setSeleccionado(p);
    setPrecio(p.precio ?? 0);
  };

  const handleConfirm = () => {
    if (!seleccionado || cantidad <= 0) return;
    onConfirm({
      productoId: seleccionado.id,
      descripcion: seleccionado.name,
      cantidad,
      precioUnitario: precio,
      descuento,
      subtotal,
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

        <input
          className="mgc-popup-search"
          placeholder="Buscar producto..."
          value={busqueda}
          autoFocus
          onChange={(e) => { stop(e); setBusqueda(e.target.value); }}
          onKeyDown={stop}
          onClick={stop}
        />

        <div className="mgc-popup-list">
          {filtrados.map((p: any) => (
            <div
              key={p.id}
              className={`mgc-popup-item${seleccionado?.id === p.id ? ' selected' : ''}`}
              onClick={(e) => { stop(e); handleSeleccionar(p); }}
            >
              {p.name}
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="mgc-popup-empty">Sin resultados</div>
          )}
        </div>

        {seleccionado && (
          <div className="mgc-popup-form">
            <div className="mgc-popup-form-row">
              <label>Cantidad</label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => { stop(e); setCantidad(Math.max(1, parseInt(e.target.value) || 1)); }}
                onKeyDown={stop}
                onClick={stop}
              />
            </div>
            <div className="mgc-popup-form-row">
              <label>Precio unit.</label>
              <input
                type="number"
                min={0}
                value={precio}
                onChange={(e) => { stop(e); setPrecio(Math.max(0, parseInt(e.target.value) || 0)); }}
                onKeyDown={stop}
                onClick={stop}
              />
            </div>
            <div className="mgc-popup-form-row">
              <label>Descuento %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={descuento}
                onChange={(e) => { stop(e); setDescuento(Math.min(100, Math.max(0, parseInt(e.target.value) || 0))); }}
                onKeyDown={stop}
                onClick={stop}
              />
            </div>
            <div className="mgc-popup-subtotal">
              Subtotal: <strong>{fmt(subtotal)}</strong>
            </div>
          </div>
        )}

        <div className="mgc-popup-actions">
          <button className="mgc-popup-cancel" onClick={(e) => { stop(e); onClose(); }}>
            Cancelar
          </button>
          <button
            className="mgc-popup-confirm"
            disabled={!seleccionado || cantidad <= 0}
            onClick={(e) => { stop(e); handleConfirm(); }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};
