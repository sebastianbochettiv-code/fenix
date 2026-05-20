import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { VariableEditorCard } from '@/object-record/record-show/components/VariableEditorCard';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const SettingsMagoChicVariableDetail = () => {
  const { variableId } = useParams<{ variableId: string }>();
  const navigate = useNavigate();
  const loadedRef = useRef(false);

  const [name, setName] = useState('');
  const [nivelLabels, setNivelLabels] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { record: variable } = useFindOneRecord({
    objectNameSingular: 'variable',
    objectRecordId: variableId ?? '',
  });

  const { updateOneRecord } = useUpdateOneRecord();

  useEffect(() => {
    if (!variable || loadedRef.current) return;
    loadedRef.current = true;
    const v = variable as any;
    setName(v.name ?? '');
    setDescripcion(v.descripcion ?? '');
    const nl = v.nivelLabels ?? '';
    if (nl.startsWith('[')) {
      try {
        setNivelLabels(JSON.parse(nl).join(', '));
      } catch {
        setNivelLabels(nl);
      }
    } else {
      setNivelLabels(nl);
    }
  }, [variable]);

  const handleGuardar = async () => {
    if (!variableId) return;
    setSaving(true);
    try {
      const parts = nivelLabels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await updateOneRecord({
        objectNameSingular: 'variable',
        idToUpdate: variableId,
        updateOneRecordInput: {
          name,
          nivelLabels: parts.length > 0 ? JSON.stringify(parts) : null,
          descripcion: descripcion || null,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!variableId) return null;

  return (
    <SubMenuTopBarContainer
      title={(variable as any)?.name ?? 'Variable'}
      links={[
        { children: 'Mago Chic', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'Variables', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: (variable as any)?.name ?? '...' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Configuración de la variable</h2>
              <p className="mgc-settings-desc">
                Nombre, niveles y árbol de nodos jerárquicos.
              </p>
            </div>
            <button
              className="mgc-ve-btn-secondary"
              onClick={() => navigate(getSettingsPath(SettingsPath.MagoChicVariables))}
            >
              ← Volver
            </button>
          </div>

          <div className="mgc-settings-form" style={{ marginBottom: 24 }}>
            <div className="mgc-cm-fields">
              <div className="mgc-cm-field mgc-cm-field-full">
                <label>Nombre</label>
                <input
                  className="mgc-cm-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Tipos de Maquinaria"
                />
              </div>
              <div className="mgc-cm-field mgc-cm-field-full">
                <label>Etiquetas de nivel (separadas por coma)</label>
                <input
                  className="mgc-cm-input"
                  value={nivelLabels}
                  onChange={(e) => setNivelLabels(e.target.value)}
                  placeholder="ej: Marca, Modelo, N° Serie"
                />
              </div>
              <div className="mgc-cm-field mgc-cm-field-full">
                <label>Descripción</label>
                <input
                  className="mgc-cm-input"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="opcional"
                />
              </div>
            </div>
            <div className="mgc-ve-form-actions">
              <button
                className="mgc-ve-btn-primary"
                disabled={saving || !name.trim()}
                onClick={handleGuardar}
              >
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
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
