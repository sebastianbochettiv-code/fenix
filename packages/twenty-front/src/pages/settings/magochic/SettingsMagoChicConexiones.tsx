import { useState, useEffect } from 'react';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { loadVariables } from '@/object-record/record-show/components/fenixVariablesUtils';

// ── Storage keys ──
const STORAGE_KEY_BOTONES = 'fenix_botones';
const STORAGE_KEY_CAMPOS = 'fenix_conexiones_campos';
const STORAGE_KEY_PLANTILLAS = 'fenix_plantillas_ia';

// ── Known options ──
const KNOWN_OBJECTS = [
  'company', 'person', 'instalacion', 'producto', 'presupuesto', 'lineaPresupuesto',
];
const BOTONES_CONOCIDOS = ['ver', 'imprimir', 'exportar', 'enviar'];

// ── Types ──
type BotonConexion = {
  id: string;
  objetoNombre: string;
  botonNombre: string;
  plantillaId: string;
  plantillaNombre: string;
  descripcion?: string;
  createdAt: string;
};

type CampoConexion = {
  id: string;
  objetoNombre: string;
  campoNombre: string;
  variableId: string;
  variableNombre: string;
  descripcion?: string;
  createdAt: string;
};

type PlantillaRef = { id: string; nombre: string; html: string };

// ── Helpers ──
const loadBotones = (): BotonConexion[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_BOTONES) ?? '[]'); } catch { return []; }
};
const saveBotones = (b: BotonConexion[]) =>
  localStorage.setItem(STORAGE_KEY_BOTONES, JSON.stringify(b));

const loadCampos = (): CampoConexion[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_CAMPOS) ?? '[]'); } catch { return []; }
};
const saveCampos = (c: CampoConexion[]) =>
  localStorage.setItem(STORAGE_KEY_CAMPOS, JSON.stringify(c));

const loadPlantillas = (): PlantillaRef[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PLANTILLAS) ?? '[]'); } catch { return []; }
};

type Tab = 'botones' | 'campos';

// ── PlantillaPicker ──
const PlantillaPicker = ({ value, onChange }: { value: string; onChange: (id: string, nombre: string) => void }) => {
  const [open, setOpen] = useState(false);
  const plantillas = loadPlantillas().filter((p) => p.html);
  const selected = plantillas.find((p) => p.id === value);

  return (
    <>
      <button type="button" className="mgc-cm-input" style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }} onClick={() => setOpen(true)}>
        {selected ? selected.nombre : '— Seleccionar plantilla —'}
      </button>
      {open && (
        <div className="mgc-popup-overlay" onClick={() => setOpen(false)}>
          <div className="mgc-popup-box" style={{ width: 480, maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="mgc-popup-header">
              <span>Seleccionar plantilla</span>
              <button className="mgc-popup-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '8px 0', overflowY: 'auto', maxHeight: '60vh' }}>
              {plantillas.length === 0 && <div className="mgc-ve-empty">Sin plantillas — creá una en Configuración → IA → Plantillas</div>}
              {plantillas.map((p) => (
                <div key={p.id} className="mgc-settings-row" style={{ cursor: 'pointer', background: p.id === value ? 'var(--t-background-transparent-medium)' : undefined }}
                  onClick={() => { onChange(p.id, p.nombre); setOpen(false); }}>
                  <div className="mgc-settings-row-info">
                    <div className="mgc-settings-row-name">{p.nombre}</div>
                    <div className="mgc-settings-row-desc" style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.html.substring(0, 80)}…</div>
                  </div>
                  {p.id === value && <span style={{ color: '#6366f1', fontWeight: 700, paddingRight: 16 }}>✓</span>}
                </div>
              ))}
            </div>
            <div className="mgc-popup-actions">
              <button className="mgc-popup-cancel" onClick={() => setOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── Main component ──
export const SettingsMagoChicConexiones = () => {
  const [tab, setTab] = useState<Tab>('botones');

  // botones state
  const [botones, setBotones] = useState<BotonConexion[]>([]);
  const [showFormBoton, setShowFormBoton] = useState(false);
  const [editingIdBoton, setEditingIdBoton] = useState<string | null>(null);
  const [bObjeto, setBObjeto] = useState('presupuesto');
  const [bBoton, setBBoton] = useState('ver');
  const [bPlantillaId, setBPlantillaId] = useState('');
  const [bPlantillaNombre, setBPlantillaNombre] = useState('');
  const [bDesc, setBDesc] = useState('');

  // campos state
  const [campos, setCampos] = useState<CampoConexion[]>([]);
  const [showFormCampo, setShowFormCampo] = useState(false);
  const [editingIdCampo, setEditingIdCampo] = useState<string | null>(null);
  const [cObjeto, setCObjeto] = useState('presupuesto');
  const [cCampo, setCCampo] = useState('');
  const [cVariableId, setCVariableId] = useState('');
  const [cDesc, setCDesc] = useState('');

  const variables = loadVariables();

  useEffect(() => {
    // Auto-seed: si no hay conexión presupuesto·ver y existe una plantilla presupuesto, crearla
    const botonesActuales = loadBotones();
    const yaExiste = botonesActuales.some(
      (b) => b.objetoNombre === 'presupuesto' && b.botonNombre === 'ver',
    );
    if (!yaExiste) {
      const plantillaPresupuesto = loadPlantillas().find(
        (p) => p.nombre?.toLowerCase().includes('presupuesto') && p.html,
      );
      if (plantillaPresupuesto) {
        const seed: BotonConexion = {
          id: 'seed-presupuesto-ver',
          objetoNombre: 'presupuesto',
          botonNombre: 'ver',
          plantillaId: plantillaPresupuesto.id,
          plantillaNombre: plantillaPresupuesto.nombre,
          descripcion: 'Conexión por defecto — editable',
          createdAt: new Date().toISOString(),
        };
        const updated = [...botonesActuales, seed];
        saveBotones(updated);
        setBotones(updated);
      } else {
        setBotones(botonesActuales);
      }
    } else {
      setBotones(botonesActuales);
    }
    setCampos(loadCampos());
  }, []);

  // ── Botones handlers ──
  const resetBoton = () => { setBObjeto('presupuesto'); setBBoton('ver'); setBPlantillaId(''); setBPlantillaNombre(''); setBDesc(''); setEditingIdBoton(null); setShowFormBoton(false); };

  const openEditBoton = (b: BotonConexion) => {
    setEditingIdBoton(b.id); setBObjeto(b.objetoNombre); setBBoton(b.botonNombre);
    setBPlantillaId(b.plantillaId); setBPlantillaNombre(b.plantillaNombre); setBDesc(b.descripcion ?? '');
    setShowFormBoton(true);
  };

  const saveBoton = () => {
    if (!bObjeto || !bBoton || !bPlantillaId) return;
    const entry: BotonConexion = { id: editingIdBoton ?? crypto.randomUUID(), objetoNombre: bObjeto, botonNombre: bBoton, plantillaId: bPlantillaId, plantillaNombre: bPlantillaNombre, descripcion: bDesc || undefined, createdAt: new Date().toISOString() };
    const updated = editingIdBoton ? botones.map((b) => b.id === editingIdBoton ? entry : b) : [...botones, entry];
    saveBotones(updated); setBotones(updated); resetBoton();
  };

  const deleteBoton = (b: BotonConexion) => {
    if (!window.confirm(`¿Eliminar "${b.objetoNombre} · ${b.botonNombre}"?`)) return;
    const updated = botones.filter((x) => x.id !== b.id);
    saveBotones(updated); setBotones(updated);
  };

  // ── Campos handlers ──
  const resetCampo = () => { setCObjeto('presupuesto'); setCCampo(''); setCVariableId(''); setCDesc(''); setEditingIdCampo(null); setShowFormCampo(false); };

  const openEditCampo = (c: CampoConexion) => {
    setEditingIdCampo(c.id); setCObjeto(c.objetoNombre); setCCampo(c.campoNombre);
    setCVariableId(c.variableId); setCDesc(c.descripcion ?? '');
    setShowFormCampo(true);
  };

  const saveCampo = () => {
    if (!cObjeto || !cCampo || !cVariableId) return;
    const variableNombre = variables.find((v) => v.id === cVariableId)?.name ?? cVariableId;
    const entry: CampoConexion = { id: editingIdCampo ?? crypto.randomUUID(), objetoNombre: cObjeto, campoNombre: cCampo, variableId: cVariableId, variableNombre, descripcion: cDesc || undefined, createdAt: new Date().toISOString() };
    const updated = editingIdCampo ? campos.map((c) => c.id === editingIdCampo ? entry : c) : [...campos, entry];
    saveCampos(updated); setCampos(updated); resetCampo();
  };

  const deleteCampo = (c: CampoConexion) => {
    if (!window.confirm(`¿Eliminar "${c.objetoNombre}.${c.campoNombre}"?`)) return;
    const updated = campos.filter((x) => x.id !== c.id);
    saveCampos(updated); setCampos(updated);
  };

  return (
    <SubMenuTopBarContainer
      title="Conexiones"
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'Conexiones' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Conexiones</h2>
              <p className="mgc-settings-desc">
                Hub de vinculaciones dinámicas: botones → plantillas hoy, campos → variables jerárquicas próximamente.
              </p>
            </div>
            <button className="mgc-ve-btn-primary" onClick={() => tab === 'botones' ? setShowFormBoton(true) : setShowFormCampo(true)}>
              + Nueva conexión
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--t-border-color-medium)' }}>
            {(['botones', 'campos'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, color: tab === t ? '#6366f1' : 'var(--t-font-color-secondary)', borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent', fontSize: 13, marginBottom: -1, textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {/* ── BOTONES ── */}
          {tab === 'botones' && (
            <>
              {showFormBoton && (
                <div className="mgc-settings-form">
                  <div className="mgc-settings-form-title">{editingIdBoton ? 'Editar' : 'Nueva conexión'} · Botón → Plantilla</div>
                  <div className="mgc-cm-fields">
                    <div className="mgc-cm-field">
                      <label>Objeto</label>
                      <select className="mgc-cm-input" value={bObjeto} onChange={(e) => setBObjeto(e.target.value)}>
                        {KNOWN_OBJECTS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="mgc-cm-field">
                      <label>Botón</label>
                      <select className="mgc-cm-input" value={bBoton} onChange={(e) => setBBoton(e.target.value)}>
                        {BOTONES_CONOCIDOS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="mgc-cm-field mgc-cm-field-full">
                      <label>Plantilla *</label>
                      <PlantillaPicker value={bPlantillaId} onChange={(id, nombre) => { setBPlantillaId(id); setBPlantillaNombre(nombre); }} />
                    </div>
                    <div className="mgc-cm-field mgc-cm-field-full">
                      <label>Descripción</label>
                      <input className="mgc-cm-input" value={bDesc} placeholder="Nota opcional..." onChange={(e) => setBDesc(e.target.value)} />
                    </div>
                  </div>
                  {bObjeto && bBoton && bPlantillaId && (
                    <div className="mgc-cm-summary" style={{ marginTop: 12 }}>
                      <span className="mgc-cm-summary-chip">{bObjeto}</span>
                      <span className="mgc-cm-summary-dot">›</span>
                      <span className="mgc-cm-summary-chip">{bBoton}</span>
                      <span className="mgc-cm-summary-dot">→</span>
                      <span className="mgc-cm-summary-chip mgc-cm-summary-var">{bPlantillaNombre}</span>
                    </div>
                  )}
                  <div className="mgc-ve-form-actions">
                    <button className="mgc-ve-btn-secondary" onClick={resetBoton}>Cancelar</button>
                    <button className="mgc-ve-btn-primary" disabled={!bObjeto || !bBoton || !bPlantillaId} onClick={saveBoton}>
                      {editingIdBoton ? 'Actualizar' : 'Guardar conexión'}
                    </button>
                  </div>
                </div>
              )}
              <div className="mgc-settings-list">
                {botones.length === 0 && !showFormBoton && <div className="mgc-ve-empty">Sin conexiones de botones — vinculá un botón a una plantilla.</div>}
                {botones.map((b) => (
                  <div key={b.id} className="mgc-settings-row">
                    <div className="mgc-settings-row-info">
                      <div className="mgc-cm-summary" style={{ margin: 0 }}>
                        <span className="mgc-cm-summary-chip">{b.objetoNombre}</span>
                        <span className="mgc-cm-summary-dot">›</span>
                        <span className="mgc-cm-summary-chip">{b.botonNombre}</span>
                        <span className="mgc-cm-summary-dot">→</span>
                        <span className="mgc-cm-summary-chip mgc-cm-summary-var">{b.plantillaNombre}</span>
                      </div>
                      {b.descripcion && <div className="mgc-settings-row-desc">{b.descripcion}</div>}
                    </div>
                    <div className="mgc-settings-row-actions">
                      <button className="mgc-ve-btn-secondary" onClick={() => openEditBoton(b)}>Editar</button>
                      <button className="mgc-ve-btn-del" onClick={() => deleteBoton(b)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── CAMPOS ── */}
          {tab === 'campos' && (
            <>
              {showFormCampo && (
                <div className="mgc-settings-form">
                  <div className="mgc-settings-form-title">{editingIdCampo ? 'Editar conexión' : 'Nueva conexión'} · Campo → Variable</div>
                  <div className="mgc-cm-fields">
                    <div className="mgc-cm-field">
                      <label>Objeto *</label>
                      <input list="mgc-objetos-list" className="mgc-cm-input" value={cObjeto} autoFocus placeholder="ej: producto" onChange={(e) => setCObjeto(e.target.value)} />
                      <datalist id="mgc-objetos-list">{KNOWN_OBJECTS.map((o) => <option key={o} value={o} />)}</datalist>
                    </div>
                    <div className="mgc-cm-field">
                      <label>Campo *</label>
                      <input className="mgc-cm-input" value={cCampo} placeholder="ej: categoria" onChange={(e) => setCCampo(e.target.value)} />
                    </div>
                    <div className="mgc-cm-field mgc-cm-field-full">
                      <label>Variable jerárquica *</label>
                      <select className="mgc-cm-input" value={cVariableId} onChange={(e) => setCVariableId(e.target.value)}>
                        <option value="">— seleccionar —</option>
                        {variables.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div className="mgc-cm-field mgc-cm-field-full">
                      <label>Descripción</label>
                      <input className="mgc-cm-input" value={cDesc} placeholder="Nota opcional..." onChange={(e) => setCDesc(e.target.value)} />
                    </div>
                  </div>
                  {cObjeto && cCampo && cVariableId && (
                    <div className="mgc-cm-summary" style={{ marginTop: 12 }}>
                      <span className="mgc-cm-summary-chip">{cObjeto}</span>
                      <span className="mgc-cm-summary-dot">›</span>
                      <span className="mgc-cm-summary-chip">{cCampo}</span>
                      <span className="mgc-cm-summary-dot">→</span>
                      <span className="mgc-cm-summary-chip mgc-cm-summary-var">{variables.find((v) => v.id === cVariableId)?.name ?? ''}</span>
                    </div>
                  )}
                  <div className="mgc-ve-form-actions">
                    <button className="mgc-ve-btn-secondary" onClick={resetCampo}>Cancelar</button>
                    <button className="mgc-ve-btn-primary" disabled={!cObjeto || !cCampo || !cVariableId} onClick={saveCampo}>
                      {editingIdCampo ? 'Actualizar' : 'Crear conexión'}
                    </button>
                  </div>
                </div>
              )}
              <div className="mgc-settings-list">
                {campos.length === 0 && !showFormCampo && <div className="mgc-ve-empty">Sin conexiones de campos — vinculá un campo con un árbol jerárquico.</div>}
                {campos.map((c) => (
                  <div key={c.id} className="mgc-settings-row">
                    <div className="mgc-settings-row-info">
                      <div className="mgc-cm-summary" style={{ margin: 0 }}>
                        <span className="mgc-cm-summary-chip">{c.objetoNombre}</span>
                        <span className="mgc-cm-summary-dot">›</span>
                        <span className="mgc-cm-summary-chip">{c.campoNombre}</span>
                        <span className="mgc-cm-summary-dot">→</span>
                        <span className="mgc-cm-summary-chip mgc-cm-summary-var">{c.variableNombre}</span>
                      </div>
                      {c.descripcion && <div className="mgc-settings-row-desc">{c.descripcion}</div>}
                    </div>
                    <div className="mgc-settings-row-actions">
                      <button className="mgc-ve-btn-secondary" onClick={() => openEditCampo(c)}>Editar</button>
                      <button className="mgc-ve-btn-del" onClick={() => deleteCampo(c)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SettingsPageContainer>
    </SubMenuTopBarContainer>
  );
};
