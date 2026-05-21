import { useState, useEffect } from 'react';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

const STORAGE_KEY = 'fenix_agentes_ia';

const PROVEEDORES = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'groq', label: 'Groq' },
  { value: 'xai', label: 'xAI (Grok)' },
  { value: 'otro', label: 'Otro (OpenAI-compatible)' },
];

const MODELOS_SUGERIDOS: Record<string, string[]> = {
  anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama3-70b-8192'],
  xai: ['grok-3', 'grok-3-mini', 'grok-beta'],
  otro: [],
};

type Agente = {
  id: string;
  nombre: string;
  proveedor: string;
  modelo: string;
  apiKey: string;
  apiBaseUrl: string;
  sistemaPrompt: string;
};

const loadAgentes = (): Agente[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const saveAgentes = (agentes: Agente[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agentes));
};

export const SettingsMagoChicIAAgentes = () => {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [proveedor, setProveedor] = useState('anthropic');
  const [modelo, setModelo] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [sistemaPrompt, setSistemaPrompt] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const existing = loadAgentes();
    // Si hay VITE_ANTHROPIC_API_KEY y no hay agentes, crea uno por defecto
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (envKey && existing.length === 0) {
      const defaultAgente: Agente = {
        id: crypto.randomUUID(),
        nombre: 'Claude (Fénix)',
        proveedor: 'anthropic',
        modelo: 'claude-sonnet-4-6',
        apiKey: envKey,
        apiBaseUrl: '',
        sistemaPrompt: '',
      };
      const withDefault = [defaultAgente];
      saveAgentes(withDefault);
      setAgentes(withDefault);
    } else {
      setAgentes(existing);
    }
  }, []);

  const resetForm = () => {
    setNombre('');
    setProveedor('anthropic');
    setModelo('');
    setApiKey('');
    setApiBaseUrl('');
    setSistemaPrompt('');
    setEditingId(null);
    setShowForm(false);
    setShowKey(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (a: Agente) => {
    setEditingId(a.id);
    setNombre(a.nombre);
    setProveedor(a.proveedor);
    setModelo(a.modelo);
    setApiKey(a.apiKey);
    setApiBaseUrl(a.apiBaseUrl);
    setSistemaPrompt(a.sistemaPrompt);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!nombre || !modelo || !apiKey) return;
    const updated = editingId
      ? agentes.map((a) =>
          a.id === editingId
            ? { ...a, nombre, proveedor, modelo, apiKey, apiBaseUrl, sistemaPrompt }
            : a,
        )
      : [
          ...agentes,
          {
            id: crypto.randomUUID(),
            nombre,
            proveedor,
            modelo,
            apiKey,
            apiBaseUrl,
            sistemaPrompt,
          },
        ];
    saveAgentes(updated);
    setAgentes(updated);
    resetForm();
  };

  const handleDelete = (a: Agente) => {
    if (!window.confirm(`¿Eliminar el agente "${a.nombre}"?`)) return;
    const updated = agentes.filter((x) => x.id !== a.id);
    saveAgentes(updated);
    setAgentes(updated);
  };

  return (
    <SubMenuTopBarContainer
      title="Agentes IA"
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'IA' },
        { children: 'Agentes' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Agentes IA</h2>
              <p className="mgc-settings-desc">
                Configura los agentes disponibles para diseño de plantillas y otras funciones.
                Cada agente tiene su proveedor, modelo y API key.
              </p>
            </div>
            <button className="mgc-ve-btn-primary" onClick={openCreate}>
              + Nuevo agente
            </button>
          </div>

          {showForm && (
            <div className="mgc-settings-form">
              <div className="mgc-settings-form-title">
                {editingId ? 'Editar agente' : 'Nuevo agente'}
              </div>
              <div className="mgc-cm-fields">
                <div className="mgc-cm-field">
                  <label>Nombre *</label>
                  <input
                    className="mgc-cm-input"
                    value={nombre}
                    autoFocus
                    placeholder="ej: Diseñador de documentos"
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="mgc-cm-field">
                  <label>Proveedor *</label>
                  <select
                    className="mgc-cm-input"
                    value={proveedor}
                    onChange={(e) => {
                      setProveedor(e.target.value);
                      setModelo('');
                    }}
                  >
                    {PROVEEDORES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="mgc-cm-field">
                  <label>Modelo *</label>
                  <input
                    list="mgc-modelos-list"
                    className="mgc-cm-input"
                    value={modelo}
                    placeholder="ej: claude-sonnet-4-6"
                    onChange={(e) => setModelo(e.target.value)}
                  />
                  <datalist id="mgc-modelos-list">
                    {(MODELOS_SUGERIDOS[proveedor] ?? []).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div className="mgc-cm-field">
                  <label>API Key *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="mgc-cm-input"
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      placeholder="sk-..."
                      onChange={(e) => setApiKey(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="mgc-ve-btn-secondary"
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
                {proveedor === 'otro' && (
                  <div className="mgc-cm-field mgc-cm-field-full">
                    <label>Base URL (OpenAI-compatible)</label>
                    <input
                      className="mgc-cm-input"
                      value={apiBaseUrl}
                      placeholder="https://api.ejemplo.com/v1"
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                    />
                  </div>
                )}
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Instrucciones adicionales (opcional)</label>
                  <textarea
                    className="mgc-cm-input"
                    value={sistemaPrompt}
                    placeholder="Contexto o instrucciones extra para este agente..."
                    rows={3}
                    onChange={(e) => setSistemaPrompt(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="mgc-ve-form-actions">
                <button className="mgc-ve-btn-secondary" onClick={resetForm}>Cancelar</button>
                <button
                  className="mgc-ve-btn-primary"
                  disabled={!nombre || !modelo || !apiKey}
                  onClick={handleSave}
                >
                  {editingId ? 'Actualizar' : 'Crear agente'}
                </button>
              </div>
            </div>
          )}

          <div className="mgc-settings-list">
            {agentes.length === 0 && !showForm && (
              <div className="mgc-ve-empty">
                Sin agentes — crea el primero para empezar a diseñar plantillas con IA.
              </div>
            )}
            {agentes.map((a) => (
              <div key={a.id} className="mgc-settings-row">
                <div className="mgc-settings-row-info">
                  <div className="mgc-settings-row-name">{a.nombre}</div>
                  <div className="mgc-settings-row-desc">
                    {PROVEEDORES.find((p) => p.value === a.proveedor)?.label ?? a.proveedor}
                    {' · '}
                    {a.modelo}
                  </div>
                </div>
                <div className="mgc-settings-row-actions">
                  <button className="mgc-ve-btn-secondary" onClick={() => openEdit(a)}>
                    Editar
                  </button>
                  <button className="mgc-ve-btn-del" onClick={() => handleDelete(a)}>
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
