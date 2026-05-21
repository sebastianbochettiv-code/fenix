import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { VariableEditorCard } from '@/object-record/record-show/components/VariableEditorCard';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import {
  loadVariables,
  saveVariables,
} from '@/object-record/record-show/components/fenixVariablesUtils';

export const SettingsMagoChicVariableDetail = () => {
  const { variableId } = useParams<{ variableId: string }>();
  const navigate = useNavigate();
  const loadedRef = useRef(false);

  const [name, setName] = useState('');
  const [nivelLabels, setNivelLabels] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saved, setSaved] = useState(false);

  const variable = variableId ? loadVariables().find((v) => v.id === variableId) ?? null : null;

  useEffect(() => {
    if (!variable || loadedRef.current) return;
    loadedRef.current = true;
    setName(variable.name ?? '');
    setDescripcion(variable.descripcion ?? '');
    const nl = variable.nivelLabels ?? '';
    try {
      setNivelLabels(nl.startsWith('[') ? JSON.parse(nl).join(', ') : nl);
    } catch { setNivelLabels(nl); }
  }, [variable]);

  const handleGuardar = () => {
    if (!variableId || !name.trim()) return;
    const parts = nivelLabels.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = loadVariables().map((v) =>
      v.id === variableId
        ? { ...v, name: name.trim(), nivelLabels: parts.length > 0 ? JSON.stringify(parts) : '', descripcion: descripcion.trim(), updatedAt: new Date().toISOString() }
        : v,
    );
    saveVariables(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!variableId) return null;

  return (
    <SubMenuTopBarContainer
      title={variable?.name ?? 'Variable'}
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'Variables', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: variable?.name ?? '...' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Configuración de la variable</h2>
              <p className="mgc-settings-desc">Nombre, niveles y árbol de nodos jerárquicos.</p>
            </div>
            <button className="mgc-ve-btn-secondary" onClick={() => navigate(getSettingsPath(SettingsPath.MagoChicVariables))}>
              ← Volver
            </button>
          </div>

          <div className="mgc-settings-form" style={{ marginBottom: 24 }}>
            <div className="mgc-cm-fields">
              <div className="mgc-cm-field mgc-cm-field-full">
                <label>Nombre</label>
                <input className="mgc-cm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ej: Tipos de Maquinaria" />
              </div>
              <div className="mgc-cm-field mgc-cm-field-full">
                <label>Etiquetas de nivel (separadas por coma)</label>
                <input className="mgc-cm-input" value={nivelLabels} onChange={(e) => setNivelLabels(e.target.value)} placeholder="ej: Marca, Modelo, N° Serie" />
              </div>
              <div className="mgc-cm-field mgc-cm-field-full">
                <label>Descripción</label>
                <input className="mgc-cm-input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="opcional" />
              </div>
            </div>
            <div className="mgc-ve-form-actions">
              <button className="mgc-ve-btn-primary" disabled={!name.trim()} onClick={handleGuardar}>
                {saved ? '✓ Guardado' : 'Guardar cambios'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <VariableEditorCard recordId={variableId} />
          </div>
        </div>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
