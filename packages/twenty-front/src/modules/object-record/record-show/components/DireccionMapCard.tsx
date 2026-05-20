import { useEffect, useRef, useState, useCallback } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { SearchableSelect } from './SearchableSelect';

declare global { interface Window { google: any } }

const API_KEY = import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY as string;

let mapsLoaded = false;
let mapsLoading = false;
let mapsError: Error | null = null;
const mapsCallbacks: Array<{ success: () => void; error?: (e: Error) => void }> = [];

function loadGoogleMaps(callback: () => void, errorCallback?: (e: Error) => void) {
  if (mapsLoaded) { callback(); return; }
  if (mapsError) { errorCallback?.(mapsError); return; }
  mapsCallbacks.push({ success: callback, error: errorCallback });
  if (mapsLoading) return;
  mapsLoading = true;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es`;
  script.async = true;
  script.onload = () => {
    mapsLoaded = true; mapsLoading = false;
    mapsCallbacks.forEach(cb => cb.success());
    mapsCallbacks.length = 0;
  };
  script.onerror = () => {
    mapsLoading = false;
    mapsError = new Error('Error al cargar Google Maps. Verificá el API Key.');
    mapsCallbacks.forEach(cb => cb.error?.(mapsError!));
    mapsCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export const DireccionMapCard = ({ recordId }: { recordId: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const [ready, setReady] = useState(mapsLoaded);
  const [sdkError, setSdkError] = useState<string | null>(null);
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
      if (instalacionActual.direccion && inputRef.current) {
        inputRef.current.value = instalacionActual.direccion;
      }
    }
  }, [instalacionActual?.company?.id, instalacionActual?.direccion]);

  const clienteOptions = (companies as any[]).map((c: any) => ({ id: c.id, label: c.name }));

  const flashSaved = useCallback(() => {
    setSaving(false); setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleClienteChange = useCallback((id: string) => {
    setSelectedClienteId(id);
    setSaving(true); setSaved(false);
    (updateOneRecord as any)({
      objectNameSingular: 'instalacion',
      idToUpdate: recordId,
      updateOneRecordInput: { companyId: id || null },
    }).then(flashSaved).catch(flashSaved);
  }, [updateOneRecord, recordId, flashSaved]);

  const saveAddress = useCallback((address: string) => {
    if (!address.trim()) return;
    (updateOneRecord as any)({
      objectNameSingular: 'instalacion',
      idToUpdate: recordId,
      updateOneRecordInput: { direccion: address.trim() },
    });
  }, [updateOneRecord, recordId]);

  // Cargar SDK — igual que Operaciones
  useEffect(() => {
    loadGoogleMaps(
      () => setReady(true),
      (err) => setSdkError(err.message)
    );
  }, []);

  // Adjuntar Autocomplete — igual que Operaciones
  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'cl' },
      fields: ['formatted_address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        saveAddress(place.formatted_address);
      }
    });
  }, [ready, saveAddress]);

  const embedQuery = instalacionActual?.direccion ?? '';
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

      {sdkError && (
        <div style={{ padding: 8, marginBottom: 8, background: '#2a1a1a', border: '1px solid #c00', borderRadius: 4, fontSize: 12, color: '#f88' }}>
          ⚠️ {sdkError}
        </div>
      )}

      {/* Input idéntico al de Operaciones — uncontrolled, sin stopPropagation */}
      <input
        ref={inputRef}
        type="text"
        className="mgc-map-search-input"
        placeholder={!ready ? 'Cargando Google Maps...' : 'Buscar dirección...'}
        readOnly={!ready}
        defaultValue={instalacionActual?.direccion ?? ''}
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
