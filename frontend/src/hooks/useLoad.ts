import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/** GET reutilizable con estado de carga/error y recarga manual. */
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setError('');
    api<T>(path).then((d) => live && setData(d), (e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [path, tick]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}
