import { useRef, useState } from 'react';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import {
  buildNodoVariableTree,
  parseNivelLabels,
  type NodoVariable,
} from './buildNodoVariableTree';

export const VariableEditorCard = ({ recordId }: { recordId: string }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const autoExpandedRef = useRef(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<NodoVariable | null>(null);
  const [formData, setFormData] = useState({ name: '', padreId: '', orden: 0 });
  const [submitting, setSubmitting] = useState(false);

  const { record: variable } = useFindOneRecord({
    objectNameSingular: 'variable',
    objectRecordId: recordId,
  });

  const { records: nodosFlat } = useFindManyRecords({
    objectNameSingular: 'nodoVariable',
    filter: { variable: { id: { eq: recordId } } },
  } as any);

  const arbol = buildNodoVariableTree(nodosFlat as any[]);
  const nivelLabels = parseNivelLabels((variable as any)?.nivelLabels);

  if (!autoExpandedRef.current && (nodosFlat as any[]).length > 0) {
    autoExpandedRef.current = true;
    setExpanded(new Set((nodosFlat as any[]).map((n: any) => n.id)));
  }

  const { createOneRecord: createNodo } = useCreateOneRecord({
    objectNameSingular: 'nodoVariable',
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'nodoVariable',
  });

  const getLabelNivel = (nivel: number) =>
    nivelLabels[nivel] ||
    ['Categoría', 'Subcategoría', 'Tipo', 'Subtipo'][nivel] ||
    `Nivel ${nivel + 1}`;

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const expandAll = () =>
    setExpanded(new Set((nodosFlat as any[]).map((n: any) => n.id)));
  const collapseAll = () => setExpanded(new Set());

  const openCreateRoot = () => {
    setEditingNode(null);
    setFormData({ name: '', padreId: '', orden: arbol.length });
    setShowForm(true);
  };

  const openCreateChild = (parent: NodoVariable) => {
    setEditingNode(null);
    setFormData({ name: '', padreId: parent.id, orden: parent.hijos.length });
    setShowForm(true);
  };

  const openEdit = (node: NodoVariable) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      padreId: node.nodoPadre?.id ?? '',
      orden: node.orden ?? 0,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingNode(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      if (editingNode) {
        await updateOneRecord({
          objectNameSingular: 'nodoVariable',
          idToUpdate: editingNode.id,
          updateOneRecordInput: { name: formData.name, orden: formData.orden },
        });
      } else {
        await createNodo({
          name: formData.name,
          variableId: recordId,
          ...(formData.padreId ? { nodoPadreId: formData.padreId } : {}),
          orden: formData.orden,
        } as any);
      }
      cancelForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (node: NodoVariable) => {
    if (node.hijos.length > 0) {
      window.alert('Elimina primero los nodos hijos.');
      return;
    }
    if (!window.confirm(`¿Eliminar "${node.name}"?`)) return;
    await deleteOneRecord(node.id);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const renderNode = (node: NodoVariable, level = 0): React.ReactNode => {
    const hasChildren = node.hijos.length > 0;
    const isExpanded = expanded.has(node.id);
    const levelColors = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];
    const borderColor = levelColors[Math.min(level, levelColors.length - 1)];

    return (
      <div key={node.id} style={{ marginLeft: level * 24 }}>
        <div
          className="mgc-ve-node"
          style={{ borderLeftColor: borderColor }}
        >
          <span
            className="mgc-ve-toggle"
            onClick={(e) => { stop(e); if (hasChildren) toggleNode(node.id); }}
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </span>
          <span className="mgc-ve-node-name">{node.name}</span>
          <span className="mgc-ve-badge">{getLabelNivel(level)}</span>
          {hasChildren && (
            <span className="mgc-ve-count">
              {node.hijos.length} {node.hijos.length === 1 ? 'hijo' : 'hijos'}
            </span>
          )}
          <div className="mgc-ve-actions">
            <button
              className="mgc-ve-btn-add"
              onClick={(e) => { stop(e); openCreateChild(node); }}
            >
              + Hijo
            </button>
            <button
              className="mgc-ve-btn-edit"
              onClick={(e) => { stop(e); openEdit(node); }}
            >
              Editar
            </button>
            <button
              className="mgc-ve-btn-del"
              disabled={hasChildren}
              onClick={(e) => { stop(e); handleDelete(node); }}
              title={hasChildren ? 'Elimina los hijos primero' : 'Eliminar'}
            >
              ✕
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div style={{ marginTop: 4, marginBottom: 4 }}>
            {node.hijos.map((c) => renderNode(c, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mgc-ve-card" onClick={stop}>
      <div className="mgc-ve-header">
        <div>
          <span className="mgc-ve-title">{(variable as any)?.name ?? 'Árbol'}</span>
          {nivelLabels.length > 0 && (
            <span className="mgc-ve-levels">
              &nbsp;·&nbsp;{nivelLabels.join(' › ')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="mgc-ve-btn-secondary" onClick={(e) => { stop(e); expandAll(); }}>Expandir</button>
          <button className="mgc-ve-btn-secondary" onClick={(e) => { stop(e); collapseAll(); }}>Contraer</button>
          <button className="mgc-ve-btn-primary" onClick={(e) => { stop(e); openCreateRoot(); }}>+ Nodo Raíz</button>
        </div>
      </div>

      {showForm && (
        <div className="mgc-ve-form" onClick={stop}>
          <div className="mgc-ve-form-title">
            {editingNode
              ? `Editar: ${editingNode.name}`
              : formData.padreId
              ? 'Nuevo nodo hijo'
              : 'Nuevo nodo raíz'}
          </div>
          <div className="mgc-ve-form-row">
            <label>Valor</label>
            <input
              className="mgc-ve-input"
              value={formData.name}
              autoFocus
              placeholder="ej: Advance"
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') cancelForm();
              }}
              onClick={stop}
            />
          </div>
          <div className="mgc-ve-form-row">
            <label>Orden</label>
            <input
              className="mgc-ve-input mgc-ve-input-sm"
              type="number"
              min={0}
              value={formData.orden}
              onChange={(e) =>
                setFormData((d) => ({ ...d, orden: parseInt(e.target.value) || 0 }))
              }
              onClick={stop}
            />
          </div>
          <div className="mgc-ve-form-actions">
            <button
              className="mgc-ve-btn-secondary"
              onClick={(e) => { stop(e); cancelForm(); }}
            >
              Cancelar
            </button>
            <button
              className="mgc-ve-btn-primary"
              disabled={submitting || !formData.name.trim()}
              onClick={(e) => { stop(e); handleSubmit(); }}
            >
              {submitting ? 'Guardando...' : editingNode ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      <div className="mgc-ve-tree">
        {arbol.length === 0 ? (
          <div className="mgc-ve-empty">
            Sin nodos — crea el primer nodo raíz para comenzar
          </div>
        ) : (
          arbol.map((n) => renderNode(n))
        )}
      </div>
    </div>
  );
};
