import { useState } from 'react';
import { SearchableSelect } from './SearchableSelect';

type Props = {
  productos: any[];
  onConfirm: (productoId: string) => void;
  onClose: () => void;
};

export const ProductoPickerPopup = ({ productos, onConfirm, onClose }: Props) => {
  const [selectedId, setSelectedId] = useState('');

  const options = productos.map((p: any) => ({ id: p.id, label: p.name }));

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
            placeholder={options.length ? 'Seleccionar producto...' : 'Sin productos en el catálogo'}
            disabled={options.length === 0}
          />
          {options.length === 0 && (
            <div className="mgc-popup-empty" style={{ marginTop: 8 }}>
              No hay productos en el catálogo libre. Agregá productos sin empresa asignada.
            </div>
          )}
        </div>

        <div className="mgc-popup-actions">
          <button className="mgc-popup-cancel" onClick={(e) => { stop(e); onClose(); }}>
            Cancelar
          </button>
          <button
            className="mgc-popup-confirm"
            disabled={!selectedId}
            onClick={(e) => { stop(e); onConfirm(selectedId); }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};
