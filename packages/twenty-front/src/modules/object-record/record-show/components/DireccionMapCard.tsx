import { useCallback, useEffect, useRef, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { SearchableSelect } from './SearchableSelect';

declare global {
  interface Window { google: any; }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

let mapsLoaded = false;
let mapsLoading = false;
const mapsCallbacks: Array<{ ok: () => void; err: () => void }> = [];

function loadGoogleMaps(ok: () => void, err: () => void) {
  if (mapsLoaded) { ok(); return; }
  mapsCallbacks.push({ ok, err });
  if (mapsLoading) return;
  mapsLoading = true;
  const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existing) {
    if (window.google?.maps) {
      mapsLoaded = true; mapsLoading = false;
      mapsCallbacks.forEach((cb) => cb.ok());
      mapsCallbacks.length = 0;
    } else {
      existing.addEventListener('load', () => {
        mapsLoaded = true; mapsLoading = false;
        mapsCallbacks.forEach((cb) => cb.ok());
        mapsCallbacks.length = 0;
      });
    }
    return;
  }
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es`;
  script.async = true;
  script.onload = () => {
    mapsLoaded = true; mapsLoading = false;
    mapsCallbacks.forEach((cb) => cb.ok());
    mapsCallbacks.length = 0;
  };
  script.onerror = () => {
    mapsLoading = false;
    mapsCallbacks.forEach((cb) => cb.err());
    mapsCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export const DireccionMapCard = ({ recordId }: { recordId: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [embedQuery, setEmbedQuery] = useState('');
  const [sdkReady, setSdkReady] = useState(mapsLoaded);
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { updateOneRecord } = useUpdateOneRecord();
  const { records: companies } = useFindManyRecords({ objectNameSingular: 'company' });
  const { records: instalacionRecords } = useFindManyRecords({
    objectNameSingular: 'instalacion',
    filter: { id: { eq: recordId } },
    recordGqlFields: { id: true, company: { id: true }, direccion: true },
  } as any);
  const instalacionActual = (instalacionRecords as any[])[0];

  useEffect(() => {
    if (instalacionActual) {
      setSelectedClienteId(instalacionActual.company?.id ?? '');
      if (instalacionActual.direccion) setEmbedQuery(instalacionActual.direccion);
    }
  }, [instalacionActual?.company?.id, instalacionActual?.direccion]);

  const clienteOptions = (companies as any[]).map((c) => ({ id: c.id, label: c.name }));

  const flashSaved = useCallback(() => {
    setSaving(false);
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleClienteChange = useCallback((id: string) => {
    setSelectedClienteId(id);
    setSaving(true);
    setSaved(false);
    (updateOneRecord as any)({
      objectNameSingular: 'instalacion',
      idToUpdate: recordId,
      updateOneRecordInput: { companyId: id || null },
    }).then(flashSaved).catch(flashSaved);
  }, [updateOneRecord, recordId, flashSaved]);

  const saveAddress = (address: string) => {
    if (!address.trim()) return;
    setEmbedQuery(address.trim());
    updateOneRecord({
      objectNameSingular: 'instalacion',
      idToUpdate: recordId,
      updateOneRecordInput: { direccion: address.trim() },
    });
  };

  useEffect(() => {
    if (mapsLoaded) { setSdkReady(true); return; }
    loadGoogleMaps(() => setSdkReady(true), () => {});
  }, []);

  useEffect(() => {
    if (!sdkReady || !inputRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'cl' },
      fields: ['formatted_address'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        saveAddress(place.formatted_address as string);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  const embedUrl = embedQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&output=embed&hl=es`
    : null;

  return (
    <div className="mgc-direccion-card">
      <span className="mgc-direccion-label">Instalación</span>

      <div className="mgc-pres-field" style={{ marginBottom: 4 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', width: 90, flexShrink: 0 }}>
          Cliente
        </label>
        <SearchableSelect
          options={clienteOptions}
          value={selectedClienteId}
          onChange={handleClienteChange}
          placeholder="Buscar cliente..."
        />
      </div>
      <div style={{ padding: '0 0 8px', minHeight: 20 }}>
        {saving && <span style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.5, color: 'var(--t-font-color-light)' }}>Guardando...</span>}
        {!saving && saved && <span style={{ fontSize: 12, fontStyle: 'italic', color: '#fff', background: '#22c55e', borderRadius: 6, padding: '2px 10px' }}>✓ Guardado</span>}
      </div>

      {/* ── Dirección ── */}
      <input
        ref={inputRef}
        type="text"
        className="mgc-map-search-input"
        placeholder="Buscar dirección..."
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter' && inputRef.current?.value?.trim()) {
            saveAddress(inputRef.current.value.trim());
          }
        }}
        onBlur={() => {
          const val = inputRef.current?.value?.trim();
          if (val) saveAddress(val);
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <div style={{ flex: 1, minHeight: 0, marginTop: 8 }}>
        {embedUrl ? (
          <iframe
            key={embedUrl}
            title="mapa-direccion"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ display: 'block', border: 'none', pointerEvents: 'none' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="mgc-direccion-placeholder">
            Ingresá una dirección y seleccioná una sugerencia
          </div>
        )}
      </div>
    </div>
  );
};
