import { useState } from 'react';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

const KNOWN_OBJECTS = [
  'company', 'person', 'instalacion', 'producto', 'presupuesto', 'lineaPresupuesto',
];

export const SettingsMagoChicConexiones = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [objetoNombre, setObjetoNombre] = useState('');
  const [campoNombre, setCampoNombre] = useState('');
  const [variableId, setVariableId] = useState('');
  const [saving, setSaving] = useState(false);

  const { records: conexiones, loading } = useFindManyRecords({
    objectNameSingular: 'conexion',
  });

  const { records: variables } = useFindManyRecords({
    objectNameSingular: 'variable',
  });

  const { createOneRecord } = useCreateOneRecord({ objectNameSingular: 'conexion' });
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({ objectNameSingular: 'conexion' });

  const resetForm = () => {
    setObjetoNombre('');
    setCampoNombre('');
    setVariableId('');
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setObjetoNombre(c.objetoNombre ?? '');
    setCampoNombre(c.campoNombre ?? '');
    setVariableId(c.variable?.id ?? '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!objetoNombre || !campoNombre || !variableId) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateOneRecord({
          objectNameSingular: 'conexion',
          idToUpdate: editingId,
          updateOneRecordInput: { objetoNombre, campoNombre, variableId },
        });
      } else {
        await createOneRecord({ objetoNombre, campoNombre, variableId } as any);
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: any) => {
    if (!window.confirm(`¿Eliminar la conexión "${c.objetoNombre}.${c.campoNombre}"?`)) return;
    await deleteOneRecord(c.id);
  };

  const getVariableName = (id: string) =>
    (variables as any[]).find((v: any) => v.id === id)?.name ?? id;

  return (
    <SubMenuTopBarContainer
      title="Conexiones"
      links={[
        { children: 'Mago Chic', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'Conexiones' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Conexiones</h2>
              <p className="mgc-settings-desc">
                Vinculan un campo de un objeto con una variable jerárquica.
                El campo mostrará automáticamente el selector en cascada.
              </p>
            </div>
            <button className="mgc-ve-btn-primary" onClick={openCreate}>
              + Nueva conexión
            </button>
          </div>

          {showForm && (
            <div className="mgc-settings-form">
              <div className="mgc-settings-form-title">
                {editingId ? 'Editar conexión' : 'Nueva conexión'}
              </div>
              <div className="mgc-cm-fields">
                <div className="mgc-cm-field">
                  <label>Objeto *</label>
                  <input
                    list="mgc-objetos-list"
                    className="mgc-cm-input"
                    value={objetoNombre}
                    autoFocus
                    placeholder="ej: producto"
                    onChange={(e) => setObjetoNombre(e.target.value)}
                  />
                  <datalist id="mgc-objetos-list">
                    {KNOWN_OBJECTS.map((o) => <option key={o} value={o} />)}
                  </datalist>
                </div>
                <div className="mgc-cm-field">
                  <label>Campo *</label>
                  <input
                    className="mgc-cm-input"
                    value={campoNombre}
                    placeholder="ej: categoria"
                    onChange={(e) => setCampoNombre(e.target.value)}
                  />
                </div>
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Variable jerárquica *</label>
                  <select
                    className="mgc-cm-input"
                    value={variableId}
                    onChange={(e) => setVariableId(e.target.value)}
                  >
                    <option value="">— seleccionar —</option>
                    {(variables as any[]).map((v: any) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {objetoNombre && campoNombre && variableId && (
                <div className="mgc-cm-summary" style={{ marginTop: 12 }}>
                  <span className="mgc-cm-summary-chip">{objetoNombre}</span>
                  <span className="mgc-cm-summary-dot">›</span>
                  <span className="mgc-cm-summary-chip">{campoNombre}</span>
                  <span className="mgc-cm-summary-dot">→</span>
                  <span className="mgc-cm-summary-chip mgc-cm-summary-var">
                    {getVariableName(variableId)}
                  </span>
                </div>
              )}

              <div className="mgc-ve-form-actions">
                <button className="mgc-ve-btn-secondary" onClick={resetForm}>Cancelar</button>
                <button
                  className="mgc-ve-btn-primary"
                  disabled={saving || !objetoNombre || !campoNombre || !variableId}
                  onClick={handleSave}
                >
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear conexión'}
                </button>
              </div>
            </div>
          )}

          <div className="mgc-settings-list">
            {loading && <div className="mgc-ve-empty">Cargando conexiones...</div>}
            {!loading && (conexiones as any[]).length === 0 && (
              <div className="mgc-ve-empty">
                Sin conexiones — crea la primera para vincular un campo con un árbol jerárquico.
              </div>
            )}
            {(conexiones as any[]).map((c: any) => (
              <div key={c.id} className="mgc-settings-row">
                <div className="mgc-settings-row-info">
                  <div className="mgc-cm-summary" style={{ margin: 0 }}>
                    <span className="mgc-cm-summary-chip">{c.objetoNombre}</span>
                    <span className="mgc-cm-summary-dot">›</span>
                    <span className="mgc-cm-summary-chip">{c.campoNombre}</span>
                    <span className="mgc-cm-summary-dot">→</span>
                    <span className="mgc-cm-summary-chip mgc-cm-summary-var">
                      {c.variable?.name ?? getVariableName(c.variable?.id)}
                    </span>
                  </div>
                  {c.descripcion && (
                    <span className="mgc-settings-row-desc">{c.descripcion}</span>
                  )}
                </div>
                <div className="mgc-settings-row-actions">
                  <button className="mgc-ve-btn-secondary" onClick={() => openEdit(c)}>
                    Editar
                  </button>
                  <button className="mgc-ve-btn-del" onClick={() => handleDelete(c)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
