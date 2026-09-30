import { AlertTriangle, Bell, CheckCircle2, LogOut, UserRound } from 'lucide-react';
import { useLoad } from '../hooks/useLoad';
import type { Notice, Role, User } from '../types';
import { Dropdown } from './Dropdown';
import type { SectionId } from './Sidebar';

export const ROLE_LABEL: Record<Role, string> = { ADMIN: 'Administrador', USER: 'Usuario' };
const item = 'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-line/40 hover:text-fg';

export function Header({ user, section, onNavigate, onLogout }: { user: User; section: SectionId; onNavigate: (s: SectionId) => void; onLogout: () => void }) {
  const notices = useLoad<Notice[]>(`/notifications?k=${section}`).data ?? []; // se recarga al cambiar de sección
  const display = user.name || user.email;
  return (
    <div className="mb-6 flex items-center justify-end gap-2">
      <Dropdown label="Notificaciones" button={
        <span className="relative block p-1"><Bell size={20} aria-hidden />
          {notices.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-bg">{notices.length}</span>}
        </span>}>
        {() => notices.length === 0 ? <p className="p-3 text-sm text-muted">Sin notificaciones</p> : (
          <ul>{notices.map((n) => (
            <li key={n.id} className="flex items-start gap-3 rounded-xl p-3 text-sm">
              {n.kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />}
              {n.message}
            </li>))}
          </ul>)}
      </Dropdown>
      <Dropdown label="Menú de perfil" button={
        <span className="flex items-center gap-2 text-fg">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/15 text-sm font-semibold text-brand">{display.slice(0, 2).toUpperCase()}</span>
          <span className="hidden max-w-40 truncate text-sm sm:block">{display}</span>
        </span>}>
        {(close) => (
          <>
            <div className="mb-1 border-b border-line p-3">
              <p className="truncate font-medium">{display}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
              <span className="mt-2 inline-block rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">{ROLE_LABEL[user.role]}</span>
            </div>
            <button className={item} onClick={() => { onNavigate('profile'); close(); }}><UserRound size={16} aria-hidden />Mi perfil</button>
            <button className={item} onClick={() => { close(); onLogout(); }}><LogOut size={16} aria-hidden />Cerrar sesión</button>
          </>)}
      </Dropdown>
    </div>
  );
}
