import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SubMenuTopBarContainer } from '@/ui/layout/page/components/SubMenuTopBarContainer';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

export const STORAGE_KEY_PLANTILLAS = 'fenix_plantillas_ia';

export const TEMPLATE_PRESUPUESTO_VERSION = 'v4';

export const TEMPLATE_PRESUPUESTO_HTML = `<!-- FENIX_TEMPLATE_PRESUPUESTO_${TEMPLATE_PRESUPUESTO_VERSION} -->
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a2e; background: #fff; padding: 40px 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .logo-area h1 { font-size: 22px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
  .logo-area p { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-label { text-align: right; }
  .doc-label .tipo { font-size: 26px; font-weight: 700; color: #6366f1; letter-spacing: -1px; }
  .doc-label .numero { font-size: 13px; color: #6b7280; margin-top: 2px; }
  .meta-row { display: flex; gap: 24px; background: #f8f9ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px; }
  .meta-item { flex: 1; }
  .meta-item .label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-item .value { font-size: 12px; font-weight: 500; color: #1a1a2e; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .party-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; }
  .party-box .party-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
  .party-box .name { font-size: 14px; font-weight: 700; color: #1a1a2e; }
  .party-box .detail { font-size: 11px; color: #6b7280; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead { background: #6366f1; color: #fff; }
  thead th { padding: 9px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
  thead th:last-child, thead th:nth-last-child(2), thead th:nth-last-child(3) { text-align: right; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 9px 12px; font-size: 11px; color: #374151; vertical-align: top; }
  tbody td:last-child, tbody td:nth-last-child(2), tbody td:nth-last-child(3) { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
  .totals-row .t-label { font-size: 11px; color: #6b7280; }
  .totals-row .t-value { font-size: 11px; font-weight: 600; color: #1a1a2e; }
  .totals-row.total-final { padding: 10px 12px; background: #6366f1; border-radius: 6px; margin-top: 6px; border-bottom: none; }
  .totals-row.total-final .t-label { color: #c7d2fe; font-weight: 600; font-size: 12px; }
  .totals-row.total-final .t-value { color: #fff; font-size: 15px; font-weight: 800; }
  .notas-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
  .notas-box .notas-label { font-size: 10px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .notas-box p { font-size: 11px; color: #78350f; line-height: 1.6; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .footer .empresa { font-size: 11px; color: #9ca3af; }
  .footer .estado-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 12px; border-radius: 999px; background: #e0e7ff; color: #4338ca; }
  .valido { font-size: 10px; color: #9ca3af; text-align: right; margin-top: 2px; }
</style>
</head>
<body>

<!-- ENCABEZADO -->
<div class="header">
  <div class="logo-area">
    <h1>{{empresa_nombre}}</h1>
    <p>{{empresa_rut}} · {{empresa_email}}</p>
  </div>
  <div class="doc-label">
    <div class="tipo">PRESUPUESTO</div>
    <div class="numero">N° {{presupuesto_numero}}</div>
  </div>
</div>

<!-- META: FECHAS -->
<div class="meta-row">
  <div class="meta-item">
    <div class="label">Fecha emisión</div>
    <div class="value">{{fecha_creacion}}</div>
  </div>
  <div class="meta-item">
    <div class="label">Válido hasta</div>
    <div class="value">{{fecha_vencimiento}}</div>
  </div>
  <div class="meta-item">
    <div class="label">Moneda</div>
    <div class="value">{{moneda}}</div>
  </div>
  <div class="meta-item">
    <div class="label">Estado</div>
    <div class="value">{{estado}}</div>
  </div>
</div>

<!-- PARTES -->
<div class="parties">
  <div class="party-box">
    <div class="party-label">Emisor</div>
    <div class="name">{{empresa_nombre}}</div>
    <div class="detail">RUT: {{empresa_rut}}</div>
    <div class="detail">{{empresa_direccion}}</div>
    <div class="detail">{{empresa_telefono}}</div>
  </div>
  <div class="party-box">
    <div class="party-label">Cliente</div>
    <div class="name">{{cliente_nombre}}</div>
    <div class="detail">RUT: {{cliente_rut}}</div>
    <div class="detail">Contacto: {{contacto_nombre}}</div>
    <div class="detail">Instalación: {{instalacion_nombre}}</div>
  </div>
</div>

<!-- TABLA DE PRODUCTOS -->
<div class="section">
  <div class="section-title">Detalle de productos y servicios</div>
  <table>
    <thead>
      <tr>
        <th style="width:40%">Descripción</th>
        <th style="width:12%">Código</th>
        <th style="width:8%; text-align:right">Cant.</th>
        <th style="width:15%; text-align:right">Precio unit.</th>
        <th style="width:10%; text-align:right">Desc.%</th>
        <th style="width:15%; text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
{{PRODUCTOS_TABLE_BODY}}
    </tbody>
  </table>
</div>

<!-- TOTALES -->
<div class="totals">
  <div class="totals-box">
    <div class="totals-row">
      <span class="t-label">Neto</span>
      <span class="t-value">{{total_neto}}</span>
    </div>
    <div class="totals-row">
      <span class="t-label">Descuento global</span>
      <span class="t-value">- {{descuento_global}}</span>
    </div>
    <div class="totals-row">
      <span class="t-label">IVA (19%)</span>
      <span class="t-value">{{total_iva}}</span>
    </div>
    <div class="totals-row total-final">
      <span class="t-label">TOTAL</span>
      <span class="t-value">{{total_bruto}}</span>
    </div>
  </div>
</div>

<!-- NOTAS -->
<div class="notas-box">
  <div class="notas-label">Notas y condiciones</div>
  <p>{{notas}}</p>
</div>

<!-- PIE -->
<div class="footer">
  <div class="empresa">
    <div>{{empresa_nombre}} · {{empresa_rut}}</div>
    <div class="valido">Presupuesto válido hasta {{fecha_vencimiento}}</div>
  </div>
  <div class="estado-badge">{{estado}}</div>
</div>

</body>
</html>`;

export type Plantilla = {
  id: string;
  nombre: string;
  html: string;
  historialChat: string;
  updatedAt: string;
};

export const loadPlantillas = (): Plantilla[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PLANTILLAS) ?? '[]');
  } catch {
    return [];
  }
};

export const savePlantillas = (plantillas: Plantilla[]) => {
  localStorage.setItem(STORAGE_KEY_PLANTILLAS, JSON.stringify(plantillas));
};

export const SettingsMagoChicIAPlantillas = () => {
  const navigate = useNavigate();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);

  useEffect(() => {
    const all = loadPlantillas();
    const marker = `FENIX_TEMPLATE_PRESUPUESTO_${TEMPLATE_PRESUPUESTO_VERSION}`;
    const seeded = all.map((p) => {
      const esPresupuesto = p.nombre.toLowerCase().includes('presupuesto');
      const necesitaUpdate = esPresupuesto && (!p.html || !p.html.includes(marker));
      if (necesitaUpdate) {
        return { ...p, html: TEMPLATE_PRESUPUESTO_HTML, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    if (JSON.stringify(seeded) !== JSON.stringify(all)) {
      savePlantillas(seeded);
    }
    setPlantillas(seeded);
  }, []);

  const handleNew = () => {
    const id = crypto.randomUUID();
    const nueva: Plantilla = {
      id,
      nombre: `Plantilla ${new Date().toLocaleDateString('es-CL')}`,
      html: '',
      historialChat: '[]',
      updatedAt: new Date().toISOString(),
    };
    const updated = [nueva, ...loadPlantillas()];
    savePlantillas(updated);
    navigate(
      getSettingsPath(SettingsPath.MagoChicIAPlantillaDiseno, { plantillaId: id }),
    );
  };

  const handleOpen = (p: Plantilla) => {
    navigate(
      getSettingsPath(SettingsPath.MagoChicIAPlantillaDiseno, { plantillaId: p.id }),
    );
  };

  const handleDelete = (p: Plantilla) => {
    if (!window.confirm(`¿Eliminar la plantilla "${p.nombre}"?`)) return;
    const updated = loadPlantillas().filter((x) => x.id !== p.id);
    savePlantillas(updated);
    setPlantillas(updated);
  };

  return (
    <SubMenuTopBarContainer
      title="Plantillas IA"
      links={[
        { children: 'Fénix core', href: getSettingsPath(SettingsPath.MagoChicVariables) },
        { children: 'IA', href: getSettingsPath(SettingsPath.MagoChicIAAgentes) },
        { children: 'Plantillas' },
      ]}
    >
      <SettingsPageContainer>
        <div className="mgc-settings-section">
          <div className="mgc-settings-header">
            <div>
              <h2 className="mgc-settings-title">Plantillas IA</h2>
              <p className="mgc-settings-desc">
                Documentos HTML diseñados con IA. Abrí una plantilla para seguir editándola
                en el diseñador interactivo.
              </p>
            </div>
            <button className="mgc-ve-btn-primary" onClick={handleNew}>
              + Nueva plantilla
            </button>
          </div>

          <div className="mgc-settings-list">
            {plantillas.length === 0 && (
              <div className="mgc-ve-empty">
                Sin plantillas — creá la primera para diseñar documentos corporativos con IA.
              </div>
            )}
            {plantillas.map((p) => (
              <div
                key={p.id}
                className="mgc-settings-row"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpen(p)}
              >
                <div className="mgc-settings-row-info">
                  <div className="mgc-settings-row-name">{p.nombre || 'Sin nombre'}</div>
                  {p.html ? (
                    <div
                      className="mgc-settings-row-desc"
                      style={{ fontFamily: 'monospace', fontSize: 11 }}
                    >
                      {p.html.substring(0, 100)}
                      {p.html.length > 100 ? '…' : ''}
                    </div>
                  ) : (
                    <div className="mgc-settings-row-desc" style={{ fontStyle: 'italic' }}>
                      Sin contenido aún
                    </div>
                  )}
                </div>
                <div
                  className="mgc-settings-row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="mgc-ve-btn-secondary" onClick={() => handleOpen(p)}>
                    Abrir
                  </button>
                  <button className="mgc-ve-btn-del" onClick={() => handleDelete(p)}>
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
