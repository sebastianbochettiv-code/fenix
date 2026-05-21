export const STORAGE_KEY_CONEXIONES = 'fenix_conexiones';

export type ConexionBoton = {
  id: string;
  tipo: 'boton';
  objetoNombre: string;
  botonNombre: string;
  plantillaId: string;
  plantillaNombre: string;
  descripcion?: string;
  createdAt: string;
};

export type ConexionCampo = {
  id: string;
  tipo: 'campo';
  objetoNombre: string;
  campoNombre: string;
  variableId: string;
  variableNombre: string;
  descripcion?: string;
  createdAt: string;
};

export type Conexion = ConexionBoton | ConexionCampo;

export const loadConexiones = (): Conexion[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CONEXIONES) ?? '[]');
  } catch {
    return [];
  }
};

export const saveConexiones = (conexiones: Conexion[]) => {
  localStorage.setItem(STORAGE_KEY_CONEXIONES, JSON.stringify(conexiones));
};

export const getPlantillaParaBoton = (
  objetoNombre: string,
  botonNombre: string,
): ConexionBoton | null => {
  const conexiones = loadConexiones();
  return (
    (conexiones.find(
      (c) =>
        c.tipo === 'boton' &&
        c.objetoNombre === objetoNombre &&
        c.botonNombre === botonNombre,
    ) as ConexionBoton) ?? null
  );
};
