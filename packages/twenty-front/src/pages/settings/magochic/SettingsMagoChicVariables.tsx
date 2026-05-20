import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const SettingsMagoChicVariables = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [nivelLabels, setNivelLabels] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  const { records: variables, loading } = useFindManyRecords({
    objectNameSingular: 'variable',
  });

  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'variable',
  });
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'variable',
  });

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await createOneRecord({
        name: name.trim(),
        nivelLabels: nivelLabels.trim() || null,
        descripcion: descripcion.trim() || null,
      } as any);
      setName('');
      setNivelLabels('');
      setDescripcion('');
      setShowForm(false);
      if ((created as any)?.id) {
        navigate(
          getSettingsPath(SettingsPath.MagoChicVariableDetail).replace(
            ':variableId',
            (created as any).id,
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: any) => {
    if (!window.confirm(`¿Eliminar la variable "${v.name}"? Se perderán todos sus nodos.`)) return;
    await deleteOneRecord(v.id);
  };

  const nivelPreview = (labels: string) => {
    if (!labels) return null;
    const parts = labels.startsWith('[')
      ? JSON.parse(labels)
      : labels.split(',').map((s: string) => s.trim()).filter(Boolean);
    return parts.join(' › ');
  };

  return (
    <SubMenuTopBarContainer
      title="Variables"
      links={[
        { children: 'Mago Chic', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'Variables' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Variables Jerárquicas</h2>
              <p className="mgc-settings-desc">
                Árboles de clasificación configurables que se conectan a campos de cualquier módulo.
              </p>
            </div>
            <button
              className="mgc-ve-btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Nueva variable
            </button>
          </div>

          {showForm && (
            <div className="mgc-settings-form">
              <div className="mgc-settings-form-title">Nueva variable jerárquica</div>
              <div className="mgc-cm-fields">
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Nombre *</label>
                  <input
                    className="mgc-cm-input"
                    value={name}
                    autoFocus
                    placeholder="ej: Tipos de Maquinaria"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowForm(false); }}
                  />
                </div>
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Etiquetas de nivel (separadas por coma)</label>
                  <input
                    className="mgc-cm-input"
                    value={nivelLabels}
                    placeholder="ej: Marca, Modelo, N° Serie"
                    onChange={(e) => setNivelLabels(e.target.value)}
                  />
                </div>
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Descripción</label>
                  <input
                    className="mgc-cm-input"
                    value={descripcion}
                    placeholder="ej: Clasificación de equipos industriales"
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
              </div>
              <div className="mgc-ve-form-actions">
                <button className="mgc-ve-btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button
                  className="mgc-ve-btn-primary"
                  disabled={saving || !name.trim()}
                  onClick={handleCreate}
                >
                  {saving ? 'Creando...' : 'Crear y editar árbol'}
                </button>
              </div>
            </div>
          )}

          <div className="mgc-settings-list">
            {loading && (
              <div className="mgc-ve-empty">Cargando variables...</div>
            )}
            {!loading && (variables as any[]).length === 0 && (
              <div className="mgc-ve-empty">
                Sin variables — crea la primera para comenzar.
              </div>
            )}
            {(variables as any[]).map((v: any) => (
              <div
                key={v.id}
                className="mgc-settings-row"
                onClick={() =>
                  navigate(
                    getSettingsPath(SettingsPath.MagoChicVariableDetail).replace(':variableId', v.id),
                  )
                }
              >
                <div className="mgc-settings-row-info">
                  <span className="mgc-settings-row-name">{v.name}</span>
                  {v.nivelLabels && (
                    <span className="mgc-settings-row-sub">
                      {nivelPreview(v.nivelLabels)}
                    </span>
                  )}
                  {v.descripcion && (
                    <span className="mgc-settings-row-desc">{v.descripcion}</span>
                  )}
                </div>
                <div className="mgc-settings-row-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="mgc-ve-btn-secondary"
                    onClick={() =>
                      navigate(
                        getSettingsPath(SettingsPath.MagoChicVariableDetail).replace(':variableId', v.id),
                      )
                    }
                  >
                    Editar árbol
                  </button>
                  <button
                    className="mgc-ve-btn-del"
                    onClick={() => handleDelete(v)}
                  >
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
