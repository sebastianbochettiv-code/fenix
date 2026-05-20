import { useNavigate } from 'react-router-dom';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';

export const ClienteInstalacionesCard = ({ recordId }: { recordId: string }) => {
  const navigate = useNavigate();

  const { records: instalaciones, loading } = useFindManyRecords({
    objectNameSingular: 'instalacion',
    recordGqlFields: { id: true, name: true, company: { id: true } },
    filter: { company: { id: { eq: recordId } } },
  } as any);

  const handleClick = (instalacionId: string) => {
    navigate(
      getAppPath(AppPath.RecordShowPage, {
        objectNameSingular: 'instalacion',
        objectRecordId: instalacionId,
      }),
    );
  };

  return (
    <div className="mgc-ci-card">
      <div className="mgc-ci-header">
        <span className="mgc-ci-title">Instalaciones</span>
        <span className="mgc-ci-count">
          {loading ? '...' : (instalaciones as any[]).length}
        </span>
      </div>

      <div className="mgc-ci-list">
        {loading && (
          <div className="mgc-ci-empty">Cargando...</div>
        )}
        {!loading && (instalaciones as any[]).length === 0 && (
          <div className="mgc-ci-empty">
            Sin instalaciones — asignale el cliente a una instalación para verla acá.
          </div>
        )}
        {(instalaciones as any[]).map((inst: any) => (
          <div
            key={inst.id}
            className="mgc-ci-row"
            onClick={() => handleClick(inst.id)}
          >
            <span className="mgc-ci-row-name">{inst.name}</span>
            <span className="mgc-ci-row-arrow">→</span>
          </div>
        ))}
      </div>
    </div>
  );
};
