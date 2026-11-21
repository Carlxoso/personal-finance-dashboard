import { useCallback, useEffect, useState } from 'react';
import type { SectionId } from '../components/Sidebar';

// Ruta visible en la barra de direcciones para cada sección: /#/gastos, /#/metas…
const SLUGS: Record<SectionId, string> = {
  dashboard: 'dashboard', accounts: 'cuentas', income: 'ingresos', expenses: 'gastos', savings: 'ahorros',
  goals: 'metas', history: 'historial', stats: 'estadisticas', reports: 'reportes', users: 'usuarios',
  settings: 'configuracion', profile: 'perfil',
};
const BY_SLUG = Object.fromEntries(Object.entries(SLUGS).map(([id, slug]) => [slug, id])) as Record<string, SectionId>;

const read = (): SectionId => BY_SLUG[window.location.hash.replace(/^#\/?/, '')] ?? 'dashboard';

/**
 * Sección activa sincronizada con la URL (hash): recargar la página conserva la sección,
 * los botones atrás/adelante del navegador funcionan y se puede compartir un enlace directo.
 * Con hash no hace falta configurar nada en Vercel.
 */
export function useHashSection() {
  const [section, setSection] = useState<SectionId>(read);
  useEffect(() => {
    const onChange = () => setSection(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = useCallback((id: SectionId) => {
    const hash = `#/${SLUGS[id]}`;
    if (window.location.hash !== hash) window.location.hash = hash;   // dispara hashchange
    window.scrollTo({ top: 0 });
  }, []);
  /** Vuelve al dashboard sin dejar la sección anterior en el historial (al cerrar sesión). */
  const reset = useCallback(() => { history.replaceState(null, '', window.location.pathname); setSection('dashboard'); }, []);
  return [section, navigate, reset] as const;
}
