import { BarChart3, FileText, History, Landmark, LayoutDashboard, LogOut, Menu, PiggyBank, ScrollText, Settings, Target, TrendingDown, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  { id: 'audit', label: 'Bitácora', icon: ScrollText },
  { id: 'settings', label: 'Configuración', icon: Settings },
] as const;

type NavId = (typeof NAV)[number]['id'];
export type SectionId = NavId | 'profile';

// Cada grupo se separa con una línea horizontal.
const GROUPS: NavId[][] = [['dashboard', 'accounts'], ['income', 'expenses', 'savings', 'goals', 'history'], ['stats', 'reports', 'users', 'audit']];
export const ADMIN_ONLY: SectionId[] = ['users', 'audit'];
const button = 'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] transition';

export function Sidebar({ active, role, onSelect, onLogout }: { active: SectionId; role: Role; onSelect: (id: SectionId) => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {   // en celular: Escape cierra el menú y la página de fondo no se desplaza
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);
  const link = (id: NavId) => {
    const { label, icon: Icon } = NAV.find((n) => n.id === id)!;
    return (
      <button key={id} aria-current={id === active ? 'page' : undefined} onClick={() => { onSelect(id); setOpen(false); }}
        className={`${button} ${id === active ? 'bg-white font-medium text-brand shadow-sm ring-1 ring-side-line' : 'text-side-muted hover:bg-side-hover hover:text-side-fg'}`}>
        <Icon size={20} aria-hidden />{label}
      </button>
    );
  };
  return (
    <>
      {/* Celular: barra superior fija con el botón del menú, para que no flote sobre el contenido */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-white/90 px-2 backdrop-blur md:hidden">
        <button aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-lg text-fg transition hover:bg-gray-100"><Menu size={22} aria-hidden /></button>
        <img src="/logo.png" alt="" className="h-7 w-7" /><span className="font-semibold">Finanzas</span>
      </div>
      <div onClick={() => setOpen(false)} aria-hidden
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-side-line bg-side p-4 text-side-fg shadow-xl transition-transform duration-300 md:translate-x-0 md:shadow-none ${open ? '' : '-translate-x-full'}`}>
        <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-side-muted hover:bg-side-hover hover:text-side-fg md:hidden"><X size={20} aria-hidden /></button>
        <div className="mb-6 mt-8 flex items-center justify-center gap-3 md:mt-2"><img src="/logo.png" alt="" className="h-11 w-11" /><p className="text-xl font-semibold text-side-fg">Finanzas</p></div>
        <nav aria-label="Principal" className="flex-1 overflow-y-auto">
          {GROUPS.map((ids, i) => (
            <div key={i} className={`space-y-1 ${i ? 'mt-3 border-t border-side-line pt-3' : ''}`}>
              {ids.filter((id) => role === 'ADMIN' || !ADMIN_ONLY.includes(id)).map(link)}
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-side-line pt-3">
          {link('settings')}
          <button onClick={onLogout} className={`${button} text-side-muted hover:bg-danger/10 hover:text-danger`}><LogOut size={20} aria-hidden />Cerrar sesión</button>
        </div>
      </aside>
    </>
  );
}
