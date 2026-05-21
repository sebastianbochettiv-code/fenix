import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  type Variable,
  loadVariables,
  saveVariables,
  loadNodos,
  saveNodos,
} from '@/object-record/record-show/components/fenixVariablesUtils';

const nivelPreview = (labels: string) => {
  if (!labels) return null;
  try {
    const parts = labels.startsWith('[')
      ? JSON.parse(labels)
      : labels.split(',').map((s: string) => s.trim()).filter(Boolean);
    return parts.join(' › ');
  } catch { return labels; }
};

export const SettingsMagoChicVariables = () => {
  const navigate = useNavigate();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [nivelLabels, setNivelLabels] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => { setVariables(loadVariables()); }, []);

  const resetForm = () => { setName(''); setNivelLabels(''); setDescripcion(''); setShowForm(false); };

  const handleCreate = () => {
    if (!name.trim()) return;
    const nueva: Variable = {
      id: crypto.randomUUID(),
      name: name.trim(),
      nivelLabels: nivelLabels.trim(),
      descripcion: descripcion.trim(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...loadVariables(), nueva];
    saveVariables(updated);
    setVariables(updated);
    resetForm();
    navigate(getSettingsPath(SettingsPath.MagoChicVariableDetail).replace(':variableId', nueva.id));
  };

  const handleDelete = (v: Variable) => {
    if (!window.confirm(`¿Eliminar la variable "${v.name}"? Se perderán todos sus nodos.`)) return;
    saveVariables(loadVariables().filter((x) => x.id !== v.id));
    saveNodos(loadNodos().filter((n) => n.variableId !== v.id));
    setVariables(loadVariables());
  };

  return (
    <SubMenuTopBarContainer
      title="Variables"
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
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
            <button className="mgc-ve-btn-primary" onClick={() => setShowForm(true)}>
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
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') resetForm(); }}
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
                <button className="mgc-ve-btn-secondary" onClick={resetForm}>Cancelar</button>
                <button className="mgc-ve-btn-primary" disabled={!name.trim()} onClick={handleCreate}>
                  Crear y editar árbol
                </button>
              </div>
            </div>
          )}

          <div className="mgc-settings-list">
            {variables.length === 0 && !showForm && (
              <div className="mgc-ve-empty">Sin variables — crea la primera para comenzar.</div>
            )}
            {variables.map((v) => (
              <div
                key={v.id}
                className="mgc-settings-row"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(getSettingsPath(SettingsPath.MagoChicVariableDetail).replace(':variableId', v.id))}
              >
                <div className="mgc-settings-row-info">
                  <div className="mgc-settings-row-name">{v.name}</div>
                  {v.nivelLabels && (
                    <div className="mgc-settings-row-desc">{nivelPreview(v.nivelLabels)}</div>
                  )}
                  {v.descripcion && (
                    <div className="mgc-settings-row-desc">{v.descripcion}</div>
                  )}
                </div>
                <div className="mgc-settings-row-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="mgc-ve-btn-secondary"
                    onClick={() => navigate(getSettingsPath(SettingsPath.MagoChicVariableDetail).replace(':variableId', v.id))}
                  >
                    Editar árbol
                  </button>
                  <button className="mgc-ve-btn-del" onClick={() => handleDelete(v)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
