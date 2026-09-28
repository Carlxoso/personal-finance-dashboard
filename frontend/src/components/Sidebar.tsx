import { BarChart3, FileText, History, LayoutDashboard, PiggyBank, Settings, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

// Agregar una sección = agregar una entrada; `ready` marca las ya implementadas.
export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ready: true },
  { id: 'income', label: 'Ingresos', icon: TrendingUp, ready: false },
  { id: 'expenses', label: 'Gastos', icon: TrendingDown, ready: false },
  { id: 'savings', label: 'Ahorros', icon: PiggyBank, ready: false },
  { id: 'goals', label: 'Metas', icon: Target, ready: false },
  { id: 'history', label: 'Historial', icon: History, ready: false },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3, ready: false },
  { id: 'reports', label: 'Reportes', icon: FileText, ready: false },
  { id: 'settings', label: 'Configuración', icon: Settings, ready: false },
] as const;

export function Sidebar({ active, onLogout }: { active: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="fixed left-3 top-3 z-30 rounded-lg border border-line bg-surface px-3 py-2 text-sm md:hidden" aria-expanded={open} onClick={() => setOpen(!open)}>Menú</button>
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-line bg-surface p-4 transition-transform md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <p className="mb-6 mt-12 px-2 text-lg font-semibold md:mt-2">Finanzas</p>
        <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon, ready }) => (
            <button key={id} disabled={!ready} aria-current={id === active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${id === active ? 'bg-brand/10 text-brand' : 'text-muted hover:text-fg'}`}>
              <Icon size={18} aria-hidden />{label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="rounded-lg px-3 py-2 text-left text-sm text-muted hover:text-fg">Cerrar sesión</button>
      </aside>
    </>
  );
}
