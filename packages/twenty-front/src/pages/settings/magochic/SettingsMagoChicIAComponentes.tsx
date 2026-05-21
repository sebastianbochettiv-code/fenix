import { useState, useEffect } from 'react';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

const STORAGE_KEY = 'fenix_componentes_ia';

const CATEGORIAS = [
  'Encabezados',
  'Tablas',
  'Totales',
  'Pies de página',
  'Logos y marcas',
  'Firmas',
  'Alertas y notas',
  'Layouts',
  'Tipografías',
  'Colores corporativos',
  'Otro',
];

type Componente = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  codigo: string;
  tags: string;
};

const loadComponentes = (): Componente[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const saveComponentes = (componentes: Componente[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(componentes));
};

export const SettingsMagoChicIAComponentes = () => {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Otro');
  const [descripcion, setDescripcion] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    setComponentes(loadComponentes());
  }, []);

  const resetForm = () => {
    setNombre('');
    setCategoria('Otro');
    setDescripcion('');
    setCodigo('');
    setTags('');
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: Componente) => {
    setEditingId(c.id);
    setNombre(c.nombre);
    setCategoria(c.categoria);
    setDescripcion(c.descripcion);
    setCodigo(c.codigo);
    setTags(c.tags);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!nombre || !codigo) return;
    const data = { nombre, categoria, descripcion, codigo, tags };
    const updated = editingId
      ? componentes.map((c) => (c.id === editingId ? { ...c, ...data } : c))
      : [...componentes, { id: crypto.randomUUID(), ...data }];
    saveComponentes(updated);
    setComponentes(updated);
    resetForm();
  };

  const handleDelete = (c: Componente) => {
    if (!window.confirm(`¿Eliminar el componente "${c.nombre}"?`)) return;
    const updated = componentes.filter((x) => x.id !== c.id);
    saveComponentes(updated);
    setComponentes(updated);
  };

  const handleCopy = (c: Componente) => {
    navigator.clipboard.writeText(c.codigo ?? '');
  };

  const filtrados = componentes.filter((c) => {
    const matchCat = !filtroCategoria || c.categoria === filtroCategoria;
    const matchText =
      !filtroTexto ||
      c.nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.tags?.toLowerCase().includes(filtroTexto.toLowerCase());
    return matchCat && matchText;
  });

  const categoriasUsadas = [...new Set(componentes.map((c) => c.categoria).filter(Boolean))];
  const previewComp = previewId ? componentes.find((c) => c.id === previewId) : null;

  return (
    <SubMenuTopBarContainer
      title="Componentes IA"
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'IA', href: getSettingsPath(SettingsPath.MagoChicIAAgentes) },
        { children: 'Componentes' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Biblioteca de Componentes</h2>
              <p className="mgc-settings-desc">
                Bloques HTML reutilizables organizados por categoría: encabezados, tablas, totales,
                pies de página. Se pueden copiar y reusar en las plantillas.
              </p>
            </div>
            <button className="mgc-ve-btn-primary" onClick={openCreate}>
              + Nuevo componente
            </button>
          </div>

          {showForm && (
            <div className="mgc-settings-form">
              <div className="mgc-settings-form-title">
                {editingId ? 'Editar componente' : 'Nuevo componente'}
              </div>
              <div className="mgc-cm-fields">
                <div className="mgc-cm-field">
                  <label>Nombre *</label>
                  <input
                    className="mgc-cm-input"
                    value={nombre}
                    autoFocus
                    placeholder="ej: Tabla de ítems con totales"
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="mgc-cm-field">
                  <label>Categoría</label>
                  <select
                    className="mgc-cm-input"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Descripción</label>
                  <input
                    className="mgc-cm-input"
                    value={descripcion}
                    placeholder="Para qué sirve este componente..."
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Tags (separados por coma)</label>
                  <input
                    className="mgc-cm-input"
                    value={tags}
                    placeholder="ej: tabla, presupuesto, azul, corporativo"
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                <div className="mgc-cm-field mgc-cm-field-full">
                  <label>Código HTML *</label>
                  <textarea
                    className="mgc-cm-input"
                    value={codigo}
                    placeholder="Pegá el código HTML del componente aquí..."
                    rows={10}
                    onChange={(e) => setCodigo(e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
              </div>

              <div className="mgc-ve-form-actions">
                <button className="mgc-ve-btn-secondary" onClick={resetForm}>Cancelar</button>
                <button
                  className="mgc-ve-btn-primary"
                  disabled={!nombre || !codigo}
                  onClick={handleSave}
                >
                  {editingId ? 'Actualizar' : 'Guardar componente'}
                </button>
              </div>
            </div>
          )}

          {!showForm && componentes.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                className="mgc-cm-input"
                value={filtroTexto}
                placeholder="Buscar componente..."
                onChange={(e) => setFiltroTexto(e.target.value)}
                style={{ flex: 1, minWidth: 180 }}
              />
              <select
                className="mgc-cm-input"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{ width: 200 }}
              >
                <option value="">Todas las categorías</option>
                {categoriasUsadas.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {(filtroTexto || filtroCategoria) && (
                <button
                  className="mgc-ve-btn-secondary"
                  onClick={() => { setFiltroTexto(''); setFiltroCategoria(''); }}
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Preview modal */}
          {previewComp && (
            <div
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setPreviewId(null)}
            >
              <div
                style={{
                  background: 'var(--t-background-primary, #fff)',
                  borderRadius: 12, padding: 24, maxWidth: 900,
                  width: '90vw', maxHeight: '85vh', overflow: 'auto',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--t-font-color-primary)' }}>{previewComp.nombre}</h3>
                    <span style={{
                      fontSize: 11,
                      background: 'var(--t-background-transparent-medium)',
                      color: 'var(--t-font-color-secondary)',
                      border: '1px solid var(--t-border-color-medium)',
                      padding: '2px 8px',
                      borderRadius: 12, marginTop: 4, display: 'inline-block',
                    }}>
                      {previewComp.categoria}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="mgc-ve-btn-secondary" onClick={() => handleCopy(previewComp)}>
                      Copiar código
                    </button>
                    <button className="mgc-ve-btn-secondary" onClick={() => setPreviewId(null)}>
                      ✕ Cerrar
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--t-font-color-tertiary)' }}>PREVIEW</div>
                  <div style={{ border: '1px solid var(--t-border-color-medium)', borderRadius: 8, overflow: 'hidden', background: 'var(--t-background-transparent-light)' }}>
                    <iframe
                      srcDoc={`<html><body style="margin:16px;font-family:sans-serif">${previewComp.codigo}</body></html>`}
                      style={{ width: '100%', height: 300, border: 'none', display: 'block' }}
                      title="preview-componente"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--t-font-color-tertiary)' }}>CÓDIGO</div>
                  <pre style={{
                    background: '#1e1e2e', color: '#cdd6f4', padding: '12px 16px',
                    borderRadius: 8, fontSize: 11, overflowX: 'auto',
                    fontFamily: 'monospace', margin: 0,
                  }}>
                    {previewComp.codigo}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="mgc-settings-list">
            {componentes.length === 0 && !showForm && (
              <div className="mgc-ve-empty">
                Sin componentes — empezá a guardar bloques HTML reutilizables para tus plantillas.
              </div>
            )}
            {!showForm && componentes.length > 0 && filtrados.length === 0 && (
              <div className="mgc-ve-empty">Sin resultados para el filtro aplicado.</div>
            )}
            {filtrados.map((c) => (
              <div key={c.id} className="mgc-settings-row">
                <div className="mgc-settings-row-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="mgc-settings-row-name">{c.nombre}</div>
                    {c.categoria && (
                      <span style={{
                        fontSize: 10,
                        background: 'var(--t-background-transparent-medium)',
                        color: 'var(--t-font-color-secondary)',
                        border: '1px solid var(--t-border-color-medium)',
                        padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap',
                      }}>
                        {c.categoria}
                      </span>
                    )}
                  </div>
                  {c.descripcion && (
                    <div className="mgc-settings-row-desc">{c.descripcion}</div>
                  )}
                  {c.tags && (
                    <div style={{ marginTop: 3 }}>
                      {c.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                        <span key={tag} style={{
                          fontSize: 10,
                          background: 'var(--t-background-transparent-light)',
                          color: 'var(--t-font-color-tertiary)',
                          border: '1px solid var(--t-border-color-light)',
                          padding: '1px 6px', borderRadius: 8, marginRight: 4,
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mgc-settings-row-actions">
                  <button className="mgc-ve-btn-secondary" onClick={() => setPreviewId(c.id)}>
                    Preview
                  </button>
                  <button className="mgc-ve-btn-secondary" onClick={() => handleCopy(c)}>
                    Copiar
                  </button>
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
