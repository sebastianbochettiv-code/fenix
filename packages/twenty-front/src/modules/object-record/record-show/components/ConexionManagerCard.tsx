import { useEffect, useRef, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import {
  buildNodoVariableTree,
  parseNivelLabels,
  type NodoVariable,
} from './buildNodoVariableTree';

const KNOWN_OBJECTS = ['company', 'person', 'instalacion', 'producto', 'presupuesto'];

export const ConexionManagerCard = ({ recordId }: { recordId: string }) => {
  const loadedRef = useRef(false);
  const [objetoNombre, setObjetoNombre] = useState('');
  const [campoNombre, setCampoNombre] = useState('');
  const [variableId, setVariableId] = useState('');
  const [saving, setSaving] = useState(false);

  const { record: conexion } = useFindOneRecord({
    objectNameSingular: 'conexion',
    objectRecordId: recordId,
  });

  const { records: variables } = useFindManyRecords({
    objectNameSingular: 'variable',
  });

  const { records: nodosFlat } = useFindManyRecords({
    objectNameSingular: 'nodoVariable',
    filter: { variable: { id: { eq: variableId || 'NO_ID' } } },
  } as any);

  const { updateOneRecord } = useUpdateOneRecord();

  useEffect(() => {
    if (!conexion || loadedRef.current) return;
    loadedRef.current = true;
    const c = conexion as any;
    setObjetoNombre(c.objetoNombre ?? '');
    setCampoNombre(c.campoNombre ?? '');
    setVariableId(c.variable?.id ?? '');
  }, [conexion]);

  const selectedVariable = (variables as any[]).find((v) => v.id === variableId);
  const arbol = buildNodoVariableTree(nodosFlat as any[]);
  const nivelLabels = parseNivelLabels((selectedVariable as any)?.nivelLabels);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await updateOneRecord({
        objectNameSingular: 'conexion',
        idToUpdate: recordId,
        updateOneRecordInput: {
          objetoNombre,
          campoNombre,
          ...(variableId ? { variableId } : {}),
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const renderTreePreview = (nodes: NodoVariable[], depth = 0): React.ReactNode =>
    nodes.map((n) => (
      <div key={n.id} style={{ marginLeft: depth * 14, padding: '1px 0' }}>
        <span
          style={{
            color: depth === 0 ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
            fontSize: 12,
          }}
        >
          {depth === 0 ? '▸' : '╰'} {n.name}
        </span>
        {n.hijos.length > 0 && renderTreePreview(n.hijos, depth + 1)}
      </div>
    ));

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="mgc-cm-card" onClick={stop}>
      <span className="mgc-direccion-label">Configurar Conexión</span>

      <div className="mgc-cm-fields">
        <div className="mgc-cm-field">
          <label>Objeto</label>
          <input
            list="mgc-cm-objetos"
            className="mgc-cm-input"
            value={objetoNombre}
            placeholder="ej: producto"
            onChange={(e) => setObjetoNombre(e.target.value)}
            onClick={stop}
          />
          <datalist id="mgc-cm-objetos">
            {KNOWN_OBJECTS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>

        <div className="mgc-cm-field">
          <label>Campo</label>
          <input
            className="mgc-cm-input"
            value={campoNombre}
            placeholder="ej: categoria"
            onChange={(e) => setCampoNombre(e.target.value)}
            onClick={stop}
          />
        </div>

        <div className="mgc-cm-field mgc-cm-field-full">
          <label>Variable Jerárquica</label>
          <select
            className="mgc-cm-input"
            value={variableId}
            onChange={(e) => setVariableId(e.target.value)}
            onClick={stop}
          >
            <option value="">— seleccionar —</option>
            {(variables as any[]).map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedVariable && (
        <div className="mgc-cm-preview">
          <div className="mgc-cm-preview-header">
            Vista previa: {(selectedVariable as any).name}
            {nivelLabels.length > 0 && (
              <span className="mgc-cm-levels">
                &nbsp;({nivelLabels.join(' › ')})
              </span>
            )}
          </div>
          <div className="mgc-cm-tree-preview">
            {arbol.length === 0 ? (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Sin nodos configurados en esta variable
              </span>
            ) : (
              renderTreePreview(arbol)
            )}
          </div>
        </div>
      )}

      {objetoNombre && campoNombre && variableId && (
        <div className="mgc-cm-summary">
          <span className="mgc-cm-summary-chip">{objetoNombre}</span>
          <span className="mgc-cm-summary-dot">›</span>
          <span className="mgc-cm-summary-chip">{campoNombre}</span>
          <span className="mgc-cm-summary-dot">→</span>
          <span className="mgc-cm-summary-chip mgc-cm-summary-var">
            {(selectedVariable as any)?.name ?? variableId}
          </span>
        </div>
      )}

      <button
        className="mgc-pres-guardar-btn"
        disabled={saving || !objetoNombre || !campoNombre || !variableId}
        onClick={(e) => { stop(e); handleGuardar(); }}
      >
        {saving ? 'Guardando...' : 'Guardar conexión'}
      </button>
    </div>
  );
};
