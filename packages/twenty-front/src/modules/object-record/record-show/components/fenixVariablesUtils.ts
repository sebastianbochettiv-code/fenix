export const STORAGE_KEY_VARIABLES = 'fenix_variables';
export const STORAGE_KEY_NODOS = 'fenix_nodos';

export type Variable = {
  id: string;
  name: string;
  nivelLabels: string;
  descripcion: string;
  updatedAt: string;
};

export type Nodo = {
  id: string;
  name: string;
  variableId: string;
  nodoPadreId: string | null;
  orden: number;
};

export const loadVariables = (): Variable[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_VARIABLES) ?? '[]'); }
  catch { return []; }
};

export const saveVariables = (vars: Variable[]) =>
  localStorage.setItem(STORAGE_KEY_VARIABLES, JSON.stringify(vars));

export const loadNodos = (): Nodo[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_NODOS) ?? '[]'); }
  catch { return []; }
};

export const saveNodos = (nodos: Nodo[]) =>
  localStorage.setItem(STORAGE_KEY_NODOS, JSON.stringify(nodos));
