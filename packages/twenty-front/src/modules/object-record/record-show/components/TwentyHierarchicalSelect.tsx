import { useEffect, useState } from 'react';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  buildNodoVariableTree,
  parseNivelLabels,
  type NodoVariable,
} from './buildNodoVariableTree';

interface TwentyHierarchicalSelectProps {
  objectName: string;
  fieldName: string;
  value?: string;
  onChange: (valueConcatenado: string, pathValues: string[]) => void;
  label?: string;
}

/**
 * Selector jerárquico dinámico en cascada.
 * Lee la Conexion para objectName.fieldName, carga el árbol de NodoVariable
 * de la Variable conectada y renderiza N selectores en cascada.
 *
 * Uso:
 *   <TwentyHierarchicalSelect
 *     objectName="producto"
 *     fieldName="categoria"
 *     value={categoriaValue}
 *     onChange={(concatenado, path) => setCategoriaValue(concatenado)}
 *   />
 */
export const TwentyHierarchicalSelect = ({
  objectName,
  fieldName,
  value,
  onChange,
  label,
}: TwentyHierarchicalSelectProps) => {
  const [seleccionCadena, setSeleccionCadena] = useState<NodoVariable[]>([]);

  const { records: conexiones } = useFindManyRecords({
    objectNameSingular: 'conexion',
    filter: { objetoNombre: { eq: objectName }, campoNombre: { eq: fieldName } },
  } as any);

  const conexion = (conexiones as any[])[0];
  const variableId = conexion?.variable?.id ?? 'NO_ID';

  const { records: nodosFlat } = useFindManyRecords({
    objectNameSingular: 'nodoVariable',
    filter: { variable: { id: { eq: variableId } } },
  } as any);

  const arbol = buildNodoVariableTree(nodosFlat as any[]);
  const nivelLabels = parseNivelLabels(conexion?.variable?.nivelLabels);

  // Restore selection path from concatenated value string
  useEffect(() => {
    if (!value || arbol.length === 0) {
      setSeleccionCadena([]);
      return;
    }
    const parts = value.split(' › ');
    let current = arbol;
    const path: NodoVariable[] = [];
    for (const part of parts) {
      const found = current.find((n) => n.name === part);
      if (!found) break;
      path.push(found);
      current = found.hijos;
    }
    setSeleccionCadena(path);
  }, [value, nodosFlat]);

  const getLabelNivel = (i: number) =>
    nivelLabels[i] ||
    ['Categoría', 'Subcategoría', 'Tipo', 'Subtipo'][i] ||
    `Nivel ${i + 1}`;

  const getNodosParaNivel = (i: number): NodoVariable[] => {
    if (i === 0) return arbol;
    const padre = seleccionCadena[i - 1];
    return padre?.hijos ?? [];
  };

  const handleNivelChange = (nivelIndex: number, nodeId: string) => {
    const nodosDelNivel = getNodosParaNivel(nivelIndex);
    const nodo = nodosDelNivel.find((n) => n.id === nodeId) ?? null;
    const nuevaCadena = seleccionCadena.slice(0, nivelIndex);

    if (!nodo) {
      setSeleccionCadena(nuevaCadena);
      onChange('', nuevaCadena.map((n) => n.name));
      return;
    }

    nuevaCadena.push(nodo);
    setSeleccionCadena(nuevaCadena);

    if (nodo.hijos.length === 0) {
      // Nodo hoja → emitir valor completo
      const concatenado = nuevaCadena.map((n) => n.name).join(' › ');
      onChange(concatenado, nuevaCadena.map((n) => n.name));
    } else {
      // Aún hay niveles → no emitir todavía
      onChange('', nuevaCadena.map((n) => n.name));
    }
  };

  if (variableId === 'NO_ID') {
    return (
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '6px 0' }}>
        Sin conexión configurada para {objectName}.{fieldName}
      </div>
    );
  }

  // Índices de niveles a mostrar: el primero más uno por cada nodo padre seleccionado que tiene hijos
  const selectores: number[] = [0];
  seleccionCadena.forEach((nodo, i) => {
    if (nodo.hijos.length > 0) selectores.push(i + 1);
  });

  const ultimoNodo = seleccionCadena[seleccionCadena.length - 1];
  const seleccionCompleta =
    ultimoNodo && ultimoNodo.hijos.length === 0;

  return (
    <div className="mgc-hier-select">
      {label && <div className="mgc-hier-label">{label}</div>}
      {selectores.map((nivelIndex) => {
        const nodos = getNodosParaNivel(nivelIndex);
        if (nodos.length === 0) return null;
        return (
          <div key={nivelIndex} className="mgc-hier-nivel">
            <label>{getLabelNivel(nivelIndex)}</label>
            <select
              className="mgc-cm-input"
              value={seleccionCadena[nivelIndex]?.id ?? ''}
              onChange={(e) => handleNivelChange(nivelIndex, e.target.value)}
            >
              <option value="">
                Seleccionar {getLabelNivel(nivelIndex).toLowerCase()}...
              </option>
              {nodos.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                  {n.hijos.length > 0 ? ' ›' : ''}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      {seleccionCompleta && (
        <div className="mgc-hier-complete">
          ✓ {seleccionCadena.map((n) => n.name).join(' › ')}
        </div>
      )}
    </div>
  );
};
