import { useCallback, useEffect, useRef, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { SearchableSelect } from './SearchableSelect';

export const ProductoClienteInstalacionCard = ({ recordId }: { recordId: string }) => {
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedInstalacionId, setSelectedInstalacionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { updateOneRecord } = useUpdateOneRecord();

  const { records: productoRecords } = useFindManyRecords({
    objectNameSingular: 'producto',
    filter: { id: { eq: recordId } },
    recordGqlFields: { id: true, company: { id: true }, instalacion: { id: true } },
  } as any);
  const productoActual = (productoRecords as any[])[0];

  const { records: companies } = useFindManyRecords({ objectNameSingular: 'company' });
  const { records: instalaciones } = useFindManyRecords({
    objectNameSingular: 'instalacion',
    recordGqlFields: { id: true, name: true, company: { id: true } },
  } as any);

  useEffect(() => {
    if (productoActual) {
      setSelectedClienteId(productoActual.company?.id ?? '');
      setSelectedInstalacionId(productoActual.instalacion?.id ?? '');
    }
  }, [productoActual?.company?.id, productoActual?.instalacion?.id]);

  const clienteOptions = (companies as any[]).map((c: any) => ({ id: c.id, label: c.name }));

  const instalOptions = selectedClienteId
    ? (instalaciones as any[])
        .filter((i: any) => i.company?.id === selectedClienteId)
        .map((i: any) => ({ id: i.id, label: i.name }))
    : [];

  const saveToRecord = useCallback(async (companyId: string | null, instalacionId: string | null) => {
    setSaving(true);
    setSaved(false);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    await (updateOneRecord as any)({
      objectNameSingular: 'producto',
      idToUpdate: recordId,
      updateOneRecordInput: { companyId, instalacionId },
    });
    setSaving(false);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, [updateOneRecord, recordId]);

  const handleClienteChange = (id: string) => {
    setSelectedClienteId(id);
    setSelectedInstalacionId('');
    saveToRecord(id || null, null);
  };

  const handleInstalacionChange = (id: string) => {
    setSelectedInstalacionId(id);
    saveToRecord(selectedClienteId || null, id || null);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="mgc-presupuesto-card" onClick={stop}>
      <span className="mgc-direccion-label">Cliente e Instalación</span>

      <div className="mgc-pres-selects">
        <div className="mgc-pres-field">
          <label>Cliente</label>
          <SearchableSelect
            options={clienteOptions}
            value={selectedClienteId}
            onChange={handleClienteChange}
            placeholder="Buscar cliente..."
          />
        </div>

        <div className="mgc-pres-field">
          <label>Instalación</label>
          <SearchableSelect
            options={instalOptions}
            value={selectedInstalacionId}
            onChange={handleInstalacionChange}
            placeholder={selectedClienteId ? 'Buscar instalación...' : '— primero seleccioná un cliente —'}
            disabled={!selectedClienteId}
          />
        </div>
      </div>

      <div style={{ padding: '4px 16px 12px', minHeight: 20 }}>
        {saving && (
          <span style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', color: 'var(--t-font-color-light)' }}>
            Guardando...
          </span>
        )}
        {!saving && saved && (
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#fff', background: '#22c55e', borderRadius: 6, padding: '2px 10px' }}>
            ✓ Guardado
          </span>
        )}
      </div>
    </div>
  );
};
