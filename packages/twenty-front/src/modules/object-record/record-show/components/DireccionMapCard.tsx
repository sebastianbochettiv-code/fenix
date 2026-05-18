import { useEffect, useRef, useState } from 'react';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

declare global {
  interface Window { google: any; }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

let mapsLoaded = false;
let mapsLoading = false;
let mapsError: Error | null = null;
const mapsCallbacks: Array<{ success: () => void; error?: (e: Error) => void }> = [];

function loadGoogleMaps(success: () => void, error?: (e: Error) => void) {
  if (mapsLoaded) { success(); return; }
  if (mapsError) { error?.(mapsError); return; }
  mapsCallbacks.push({ success, error });
  if (mapsLoading) return;
  mapsLoading = true;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=es`;
  script.async = true;
  script.onload = () => {
    mapsLoaded = true; mapsLoading = false;
    mapsCallbacks.forEach((cb) => cb.success());
    mapsCallbacks.length = 0;
  };
  script.onerror = () => {
    mapsLoading = false;
    mapsError = new Error('Error al cargar Google Maps. Verifica la API Key.');
    mapsCallbacks.forEach((cb) => cb.error?.(mapsError!));
    mapsCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export const DireccionMapCard = ({ recordId }: { recordId: string }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [ready, setReady] = useState(mapsLoaded);
  const [loadError, setLoadError] = useState<string | null>(mapsError?.message ?? null);
  const [mapAddress, setMapAddress] = useState<string | null>(null);

  const savedDireccion = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: 'direccion',
  }) as string | null;

  const savedRef = useRef(savedDireccion);
  savedRef.current = savedDireccion;
  const idRef = useRef(recordId);
  idRef.current = recordId;

  const { updateOneRecord } = useUpdateOneRecord();

  useEffect(() => {
    loadGoogleMaps(() => setReady(true), (err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    if (savedDireccion && !mapAddress) setMapAddress(savedDireccion);
  }, [savedDireccion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;
    if (savedRef.current) inputRef.current.value = savedRef.current;
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { componentRestrictions: { country: 'cl' }, fields: ['formatted_address'] },
    );
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place?.formatted_address) return;
      const address = place.formatted_address as string;
      setMapAddress(address);
      updateOneRecord({
        objectNameSingular: 'instalacion',
        idToUpdate: idRef.current,
        updateOneRecordInput: { direccion: address },
      });
    });
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const embedUrl = mapAddress
    ? `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(mapAddress)}&language=es`
    : null;

  return (
    <div className="mgc-direccion-card">
      <span className="mgc-direccion-label">Dirección</span>

      {loadError && (
        <div className="mgc-direccion-error">⚠️ {loadError}</div>
      )}

      <input
        ref={inputRef}
        type="text"
        className="mgc-direccion-input"
        placeholder={!ready && !loadError ? 'Cargando Google Maps...' : 'Buscar dirección...'}
        readOnly={!ready}
      />

      <div className="mgc-direccion-map">
        {embedUrl ? (
          <iframe
            title="mapa-direccion"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ display: 'block', border: 'none' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <div className="mgc-direccion-placeholder">
            Seleccioná una dirección para ver el mapa
          </div>
        )}
      </div>
    </div>
  );
};
