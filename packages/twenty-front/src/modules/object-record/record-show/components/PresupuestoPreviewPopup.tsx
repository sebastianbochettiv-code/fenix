import { useEffect, useRef } from 'react';
import {
  ensureTemplateActualizada,
  loadPlantillas,
} from './presupuestoTemplateUtils';

const STORAGE_KEY_BOTONES = 'fenix_botones';

function getPlantillaIdParaBoton(objetoNombre: string, botonNombre: string): string | null {
  try {
    const botones = JSON.parse(localStorage.getItem(STORAGE_KEY_BOTONES) ?? '[]');
    const found = botones.find(
      (b: any) => b.objetoNombre === objetoNombre && b.botonNombre === botonNombre,
    );
    return found?.plantillaId ?? null;
  } catch {
    return null;
  }
}

const STORAGE_KEY_COMPONENTES = 'fenix_componentes_ia';
const COMPONENTE_ID = 'fenix-presupuesto-preview-popup-v1';

function seedComponente() {
  try {
    const lista = JSON.parse(localStorage.getItem(STORAGE_KEY_COMPONENTES) ?? '[]');
    if (lista.some((c: any) => c.id === COMPONENTE_ID)) return;
    lista.push({
      id: COMPONENTE_ID,
      nombre: 'Popup Vista Previa Presupuesto',
      categoria: 'Layouts',
      descripcion: 'Renderiza la plantilla HTML de presupuesto con datos reales del registro y permite imprimir.',
      codigo: '<PresupuestoPreviewPopup recordName="" clienteNombre="" instalacionNombre="" contactoNombre="" lineas={[]} totalNeto={0} totalIVA={0} totalBruto={0} onClose={() => {}} />',
      tags: 'presupuesto, popup, preview, impresion, plantilla',
    });
    localStorage.setItem(STORAGE_KEY_COMPONENTES, JSON.stringify(lista));
  } catch {}
}


const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n);

type Linea = {
  productoId: string;
  descripcion: string;
  precioUnitario: number;
  descuento: number;
  tieneDescuento: boolean;
  subtotal: number;
};

type Props = {
  recordName: string;
  clienteNombre: string;
  clienteRut?: string;
  instalacionNombre: string;
  contactoNombre: string;
  lineas: Linea[];
  totalNeto: number;
  totalIVA: number;
  totalBruto: number;
  onClose: () => void;
};

function buildHtml(props: Omit<Props, 'onClose'>): string {
  const {
    recordName, clienteNombre, clienteRut, instalacionNombre,
    contactoNombre, lineas, totalNeto, totalIVA, totalBruto,
  } = props;

  ensureTemplateActualizada();
  let template = '';
  try {
    const plantillas = loadPlantillas();
    // Primero: buscar plantilla configurada en Conexiones → Botones
    const plantillaIdConexion = getPlantillaIdParaBoton('presupuesto', 'ver');
    const found = plantillaIdConexion
      ? plantillas.find((p) => p.id === plantillaIdConexion && p.html)
      : plantillas.find((p) => p.nombre?.toLowerCase().includes('presupuesto') && p.html);
    template = found?.html ?? '';
  } catch {}

  if (!template) {
    return `<html><body style="font-family:sans-serif;padding:40px;color:#333">
      <h2 style="color:#6366f1">Sin plantilla de presupuesto</h2>
      <p>Creá una plantilla llamada <b>"presupuestos"</b> en<br>
      <b>Configuración → IA → Plantillas</b> y el diseñador generará el HTML.</p>
    </body></html>`;
  }

  const now = new Date();
  const vence = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const fmtDate = (d: Date) => d.toLocaleDateString('es-CL');

  const productosHtml = lineas.length > 0
    ? lineas.map(l => `
      <tr>
        <td>${l.descripcion}</td>
        <td>—</td>
        <td style="text-align:right">1</td>
        <td style="text-align:right">${fmt(l.precioUnitario)}</td>
        <td style="text-align:right">${l.tieneDescuento ? l.descuento + '%' : '—'}</td>
        <td style="text-align:right">${fmt(l.subtotal)}</td>
      </tr>`).join('\n')
    : '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px;font-style:italic">Sin productos</td></tr>';

  const replacements: Record<string, string> = {
    'empresa_nombre': 'Mago Chic',
    'empresa_rut': '—',
    'empresa_email': '—',
    'empresa_direccion': '—',
    'empresa_telefono': '—',
    'presupuesto_numero': recordName,
    'fecha_creacion': fmtDate(now),
    'fecha_vencimiento': fmtDate(vence),
    'moneda': 'CLP',
    'estado': 'BORRADOR',
    'cliente_nombre': clienteNombre || '—',
    'cliente_rut': clienteRut || '—',
    'instalacion_nombre': instalacionNombre || '—',
    'contacto_nombre': contactoNombre || '—',
    'total_neto': fmt(totalNeto),
    'descuento_global': '—',
    'total_iva': fmt(totalIVA),
    'total_bruto': fmt(totalBruto),
    'notas': '—',
    'PRODUCTOS_TABLE_BODY': productosHtml,
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

export const PresupuestoPreviewPopup = ({ onClose, ...rest }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const html = buildHtml(rest);

  useEffect(() => { seedComponente(); }, []);

  const plantillaIdConexion = getPlantillaIdParaBoton('presupuesto', 'ver');
  const plantillaNombre = (() => {
    try {
      const botones = JSON.parse(localStorage.getItem(STORAGE_KEY_BOTONES) ?? '[]');
      return botones.find((b: any) => b.objetoNombre === 'presupuesto' && b.botonNombre === 'ver')?.plantillaNombre ?? null;
    } catch { return null; }
  })();

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const handlePrint = (e: React.MouseEvent) => {
    stop(e);
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };

  return (
    <div className="mgc-popup-overlay" onClick={onClose}>
      <div
        className="mgc-popup-box"
        style={{ width: 860, maxWidth: '96vw', height: '90vh', minHeight: 'unset' }}
        onClick={stop}
      >
        {/* Header */}
        <div className="mgc-popup-header">
          <span>
            🧾 Presupuesto {rest.recordName}
            {rest.clienteNombre && (
              <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.6, marginLeft: 8 }}>
                {rest.clienteNombre}
                {rest.instalacionNombre && ` · ${rest.instalacionNombre}`}
              </span>
            )}
            {plantillaNombre && (
              <span style={{
                fontSize: 10, fontWeight: 600, marginLeft: 10,
                background: plantillaIdConexion ? '#e0e7ff' : 'rgba(156,163,175,0.2)',
                color: plantillaIdConexion ? '#4338ca' : 'var(--t-font-color-tertiary)',
                padding: '2px 8px', borderRadius: 999,
              }}>
                {plantillaIdConexion ? '🔗 ' : ''}{plantillaNombre}
              </span>
            )}
          </span>
          <button className="mgc-popup-close" onClick={(e) => { stop(e); onClose(); }}>✕</button>
        </div>

        {/* Iframe con el presupuesto renderizado */}
        <iframe
          ref={iframeRef}
          srcDoc={html}
          style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }}
          title="presupuesto-preview"
          sandbox="allow-same-origin allow-scripts allow-modals"
        />

        {/* Acciones */}
        <div className="mgc-popup-actions">
          <button className="mgc-popup-cancel" onClick={(e) => { stop(e); onClose(); }}>
            Cerrar
          </button>
          <button className="mgc-popup-confirm" onClick={handlePrint}>
            🖨️ Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};
