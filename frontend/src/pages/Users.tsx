import { AlertTriangle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useConfirm } from '../components/Confirm';
import { dangerButton, Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { ROLE_LABEL } from '../components/Header';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { AdminOverview } from '../components/AdminOverview';
import { Card, EmptyState } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import type { AdminSummary, AdminUser } from '../types';

const STALE_MS = 90 * 864e5;
const isStale = (u: AdminUser) => u.active && Date.now() - new Date(u.lastLoginAt ?? u.createdAt).getTime() > STALE_MS;
const isRecent = (u: AdminUser) => !!u.lastLoginAt && Date.now() - new Date(u.lastLoginAt).getTime() <= 7 * 864e5;

type FilterKey = 'all' | 'recent' | 'stale' | 'temp' | 'inactive';
const FILTERS: { key: FilterKey; label: string; test: (u: AdminUser) => boolean }[] = [
  { key: 'all', label: 'Todos', test: () => true },
  { key: 'recent', label: 'Activos esta semana', test: isRecent },
  { key: 'stale', label: 'Sin acceso +90 días', test: isStale },
  { key: 'temp', label: 'Clave temporal', test: (u) => u.active && u.mustChangePassword },
  { key: 'inactive', label: 'Desactivados', test: (u) => !u.active },
];

const action = 'rounded-lg px-2 py-1 text-sm text-muted hover:bg-line/40 hover:text-fg';

export default function Users({ meId }: { meId: string }) {
  const { data, error, reload } = useLoad<AdminUser[]>('/admin/users');
  const summary = useLoad<AdminSummary>('/admin/summary');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const visible = (data ?? [])
    .filter(FILTERS.find((f) => f.key === filter)!.test)
    .filter((u) => !q || u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q));
  const toast = useToast();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const canDelete = !!deleting && confirmText.trim().toLowerCase() === deleting.email;

  async function run(request: Promise<unknown>, success: string) {
    try { await request; toast.success(success); reload(); summary.reload(); return true; } catch (err) { toast.error((err as Error).message); return false; }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (await run(api('/admin/users', { method: 'POST', body: { name: f.get('name'), email: f.get('email'), password: f.get('password') } }), 'Usuario creado')) setCreating(false);
  }
  function openDelete(u: AdminUser) { setDeleting(u); setConfirmText(''); }
  async function remove(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!deleting || !canDelete) return;
    setBusy(true);
    try {
      const { removed } = await api<{ removed: { transactions: number; accounts: number; goals: number } }>(`/admin/users/${deleting.id}`, { method: 'DELETE', body: { confirmEmail: confirmText } });
      toast.success(`Usuario eliminado (${removed.transactions} movimientos, ${removed.accounts} cuentas)`);
      setDeleting(null); reload(); summary.reload();
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }
  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get('password');
    if (resetting && await run(api(`/admin/users/${resetting.id}/password`, { method: 'POST', body: { password } }), 'Contraseña temporal asignada')) setResetting(null);
  }
  async function toggle(u: AdminUser) {
    const message = u.active ? `¿Desactivar a ${u.email}? Perderá su sesión y no podrá entrar.` : `¿Activar de nuevo a ${u.email}?`;
    if (await confirm({ title: u.active ? 'Desactivar usuario' : 'Activar usuario', message, confirmLabel: u.active ? 'Desactivar' : 'Activar', danger: u.active })) {
      await run(api(`/admin/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } }), u.active ? 'Usuario desactivado' : 'Usuario activado');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <button onClick={() => setCreating(true)} className={primaryButton}>+ Nuevo usuario</button>
      </header>
      {summary.data && <AdminOverview data={summary.data} />}
      {error && <p role="alert" className="text-danger">{error}</p>}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar usuarios">
            {FILTERS.map((f) => {
              const count = (data ?? []).filter(f.test).length;
              return (
                <button key={f.key} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${filter === f.key ? 'border-brand bg-brand/10 font-medium text-brand' : 'border-line text-muted hover:border-gray-300 hover:text-fg'}`}>
                  {f.label} <span className="tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo" aria-label="Buscar usuario" className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:w-64" />
        </div>
        {data && visible.length === 0 && <EmptyState title="Sin usuarios en esta vista" hint="Prueba con otro filtro o búsqueda." />}
        <ul className="divide-y divide-line">
          {visible.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name || u.email}</p>
                <p className="truncate text-sm text-muted">{u.email} · desde {new Date(u.createdAt).toLocaleDateString('es-EC')}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {u.lastLoginAt
                    ? <>Último acceso: <time dateTime={u.lastLoginAt} title={new Date(u.lastLoginAt).toLocaleString('es-EC')}>{timeAgo(u.lastLoginAt)}</time></>
                    : 'Nunca ha iniciado sesión'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs text-brand">{ROLE_LABEL[u.role]}</span>
                {u.mustChangePassword && <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">Clave temporal</span>}
                {!u.active && <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">Inactivo</span>}
                {isStale(u) && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">Sin acceso +90 días</span>}
                <button className={action} onClick={() => setResetting(u)}>Restablecer clave</button>
                {u.id !== meId && <button className={action} onClick={() => toggle(u)}>{u.active ? 'Desactivar' : 'Activar'}</button>}
                {u.id !== meId && u.role !== 'ADMIN' && <button className="rounded-lg px-2 py-1 text-sm text-danger/80 hover:bg-danger/10 hover:text-danger" onClick={() => openDelete(u)}>Eliminar</button>}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      {creating && (
        <Modal title="Nuevo usuario" onClose={() => setCreating(false)} width="max-w-lg">
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><input name="name" required maxLength={60} className={inputClass} /></Field>
            <Field label="Correo"><input name="email" type="email" required className={inputClass} /></Field>
            <div className="sm:col-span-2"><Field label="Contraseña temporal (mínimo 10 caracteres)"><input name="password" type="text" required minLength={10} autoComplete="off" className={inputClass} /></Field>
              <p className="mt-2 text-xs text-muted">La persona deberá cambiarla la primera vez que entre.</p></div>
            <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => setCreating(false)} className={secondaryButton}>Cancelar</button><button className={primaryButton}>Crear usuario</button></div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Eliminar usuario" onClose={() => !busy && setDeleting(null)} width="max-w-md">
          <form onSubmit={remove} className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
              <div>
                <p className="font-medium text-danger">Esta acción no se puede deshacer</p>
                <p className="mt-1 text-muted">Se borrarán la cuenta de <span className="font-medium text-fg">{deleting.email}</span> y todos sus datos: cuentas, movimientos, metas y categorías.</p>
              </div>
            </div>
            {deleting.active && (
              <p className="text-sm text-muted">
                Si solo quieres impedir que entre, puedes{' '}
                <button type="button" className="font-medium text-brand hover:underline" onClick={() => { const u = deleting; setDeleting(null); void toggle(u); }}>desactivarlo</button>{' '}
                y conservar sus datos.
              </p>
            )}
            <Field label={`Escribe ${deleting.email} para confirmar`}>
              <input data-autofocus value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" spellCheck={false} placeholder={deleting.email} className={inputClass} />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleting(null)} disabled={busy} className={secondaryButton}>Cancelar</button>
              <button disabled={!canDelete || busy} className={`${dangerButton} disabled:cursor-not-allowed disabled:opacity-40`}>{busy ? 'Eliminando…' : 'Eliminar permanentemente'}</button>
            </div>
          </form>
        </Modal>
      )}
      {resetting && (
        <Modal title="Restablecer clave" onClose={() => setResetting(null)} width="max-w-md">
          <form onSubmit={reset} className="space-y-4">
            <p className="text-sm text-muted">Asigna una contraseña temporal a {resetting.email}. Deberá cambiarla al entrar.</p>
            <Field label="Contraseña temporal (mínimo 10 caracteres)"><input name="password" type="text" required minLength={10} autoComplete="off" className={inputClass} /></Field>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setResetting(null)} className={secondaryButton}>Cancelar</button><button className={primaryButton}>Asignar</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
