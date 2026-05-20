export type NodoVariable = {
  id: string;
  name: string;
  orden?: number;
  nodoPadre?: { id: string } | null;
  hijos: NodoVariable[];
  [key: string]: unknown;
};

export function buildNodoVariableTree(flat: any[]): NodoVariable[] {
  const map = new Map<string, NodoVariable>(
    flat.map((n) => [n.id, { ...n, hijos: [] }]),
  );
  const roots: NodoVariable[] = [];
  map.forEach((node) => {
    const parentId = node.nodoPadre?.id;
    if (parentId) {
      const parent = map.get(parentId);
      if (parent) parent.hijos.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortByOrden = (arr: NodoVariable[]) => {
    arr.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    arr.forEach((n) => sortByOrden(n.hijos));
    return arr;
  };
  return sortByOrden(roots);
}

export function parseNivelLabels(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  try {
    const parsed = JSON.parse(value as string);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // fallback: comma-separated
  }
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
