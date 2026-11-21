import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/*
 * Caché en memoria con estrategia "stale-while-revalidate":
 * al volver a una sección se muestran al instante los últimos datos conocidos
 * y en paralelo se piden los actuales. Peticiones iguales simultáneas se comparten.
 */
const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

function fetchShared<T>(path: string): Promise<T> {
  let p = inFlight.get(path) as Promise<T> | undefined;
  if (!p) {
    p = api<T>(path).then((d) => { cache.set(path, d); return d; }).finally(() => inFlight.delete(path));
    inFlight.set(path, p);
  }
  return p;
}

/** Borra todo lo guardado. Se llama al iniciar y al cerrar sesión para no mostrar datos de otra cuenta. */
export function clearCache() { cache.clear(); inFlight.clear(); }

/** GET reutilizable con estado de carga/error, caché y recarga manual. */
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(() => (cache.get(path) as T | undefined) ?? null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    if (cache.has(path)) setData(cache.get(path) as T);   // cambio de ruta: mostrar lo conocido mientras llega lo nuevo
    fetchShared<T>(path).then((d) => live && setData(d), (e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [path, tick]);
  return { data, error, reload: () => { cache.delete(path); inFlight.delete(path); setTick((t) => t + 1); } };
}
