import { authFetch } from "@/lib/http";
const cache: Record<number, string> = {};
let allLoaded = false;
let allSucursales: { id: number; nombre: string }[] = [];

export async function getSucursalNombre(id: number): Promise<string | null> {
  if (cache[id]) return cache[id];
  try {
    if (!allLoaded) {
      const res = await authFetch("/api/sucursales");
      if (!res.ok) return null;
      allSucursales = await res.json();
      allSucursales.forEach((s) => (cache[s.id] = s.nombre));
      allLoaded = true;
    }
    const sucursal = allSucursales.find((s) => s.id === id);
    return sucursal?.nombre || null;
  } catch {
    return null;
  }
}
