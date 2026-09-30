import { BarChart3, FileText, History, Landmark, LayoutDashboard, LogOut, PiggyBank, Settings, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import type { Role } from '../types';

// Agregar una sección = agregar una entrada aquí y ubicarla en un grupo.
export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Cuentas', icon: Landmark },
  { id: 'income', label: 'Ingresos', icon: TrendingUp },
  { id: 'expenses', label: 'Gastos', icon: TrendingDown },
  { id: 'savings', label: 'Ahorros', icon: PiggyBank },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'reports', label: 'Reportes', icon: FileText },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'settings', label: 'Configuración', icon: Settings },
] as const;

type NavId = (typeof NAV)[number]['id'];
export type SectionId = NavId | 'profile';

// Cada grupo se separa con una línea horizontal.
const GROUPS: NavId[][] = [['dashboard', 'accounts'], ['income', 'expenses', 'savings', 'goals', 'history'], ['stats', 'reports', 'users']];
const ADMIN_ONLY: NavId[] = ['users'];
const button = 'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] transition';

export function Sidebar({ active, role, onSelect, onLogout }: { active: SectionId; role: Role; onSelect: (id: SectionId) => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const link = (id: NavId) => {
    const { label, icon: Icon } = NAV.find((n) => n.id === id)!;
    return (
      <button key={id} aria-current={id === active ? 'page' : undefined} onClick={() => { onSelect(id); setOpen(false); }}
        className={`${button} ${id === active ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-line/40 hover:text-fg'}`}>
        <Icon size={20} aria-hidden />{label}
      </button>
    );
  };
  return (
    <>
      <button className="fixed left-3 top-3 z-30 rounded-lg border border-line bg-surface px-3 py-2 text-sm md:hidden" aria-expanded={open} onClick={() => setOpen(!open)}>Menú</button>
      <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-line bg-surface p-4 transition-transform md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="mb-6 mt-12 flex items-center justify-center gap-3 md:mt-2"><img src="/logo.png" alt="" className="h-11 w-11" /><p className="text-xl font-semibold">Finanzas</p></div>
        <nav aria-label="Principal" className="flex-1 overflow-y-auto">
          {GROUPS.map((ids, i) => (
            <div key={i} className={`space-y-1 ${i ? 'mt-3 border-t border-line pt-3' : ''}`}>
              {ids.filter((id) => role === 'ADMIN' || !ADMIN_ONLY.includes(id)).map(link)}
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line pt-3">
          {link('settings')}
          <button onClick={onLogout} className={`${button} text-muted hover:bg-line/40 hover:text-fg`}><LogOut size={20} aria-hidden />Cerrar sesión</button>
        </div>
      </aside>
    </>
  );
}
