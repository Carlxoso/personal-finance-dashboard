import {
  Activity, KeyRound, LogIn, LogOut, RefreshCw, ShieldAlert, ShieldCheck, ShieldX, Trash2, UserCheck, UserCog, UserPlus, UserX, type LucideIcon,
} from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { Field, inputClass, secondaryButton } from '../components/Field';
import { Pagination } from '../components/Pagination';
import { Card, EmptyState, StatCard } from '../components/ui';
import { useDebounce } from '../hooks/useDebounce';
import { useLoad } from '../hooks/useLoad';
import type { AuditAction, AuditEntry, AuditSummary, Page } from '../types';

const PAGE_SIZE = 25;
type Tone = 'ok' | 'admin' | 'alert' | 'neutral';

const ACTIONS: Record<AuditAction, { label: string; icon: LucideIcon; tone: Tone }> = {
  LOGIN_SUCCESS: { label: 'Inicio de sesión', icon: LogIn, tone: 'ok' },
  LOGIN_FAILED: { label: 'Ingreso fallido', icon: ShieldAlert, tone: 'alert' },
  LOGOUT: { label: 'Cierre de sesión', icon: LogOut, tone: 'neutral' },
  PASSWORD_CHANGED: { label: 'Cambio de contraseña', icon: KeyRound, tone: 'neutral' },
  PROFILE_UPDATED: { label: 'Perfil actualizado', icon: UserCog, tone: 'neutral' },
  USER_CREATED: { label: 'Usuario creado', icon: UserPlus, tone: 'admin' },
  USER_PASSWORD_RESET: { label: 'Clave restablecida', icon: KeyRound, tone: 'admin' },
  USER_ACTIVATED: { label: 'Usuario activado', icon: UserCheck, tone: 'admin' },
  USER_DEACTIVATED: { label: 'Usuario desactivado', icon: UserX, tone: 'alert' },
  USER_DELETED: { label: 'Usuario eliminado', icon: Trash2, tone: 'alert' },
  ACCESS_DENIED: { label: 'Acceso denegado', icon: ShieldX, tone: 'alert' },
  ADMIN_REGISTERED: { label: 'Alta del administrador', icon: ShieldCheck, tone: 'ok' },
};
const TONE: Record<Tone, string> = {
  ok: 'bg-brand/10 text-brand', admin: 'bg-accent/10 text-accent', alert: 'bg-danger/10 text-danger', neutral: 'bg-gray-100 text-muted',
};
const REASON: Record<string, string> = { UNKNOWN_EMAIL: 'correo no registrado', WRONG_PASSWORD: 'contraseña incorrecta', INACTIVE: 'cuenta desactivada' };
const FIELD: Record<string, string> = { name: 'nombre', email: 'correo' };

/** Frase legible para cada evento. */
function describe(e: AuditEntry): { text: string; note?: string } {
  const who = e.actorEmail ?? 'Alguien';
  const target = e.targetEmail ?? 'un usuario';
  const d = e.details ?? {};
  switch (e.action) {
    case 'ADMIN_REGISTERED': return { text: `${who} creó la cuenta de administrador` };
    case 'LOGIN_SUCCESS': return { text: `${who} inició sesión` };
    case 'LOGIN_FAILED': return { text: `Intento de ingreso fallido para ${who}`, note: REASON[String(d.reason)] };
    case 'LOGOUT': return { text: `${who} cerró sesión` };
    case 'PASSWORD_CHANGED': return { text: `${who} cambió su contraseña` };
    case 'PROFILE_UPDATED': {
      const changed = (Array.isArray(d.changed) ? d.changed : []).map((f) => FIELD[String(f)] ?? String(f)).join(' y ');
      return { text: `${who} actualizó su ${changed || 'perfil'}`, note: d.previousEmail ? `antes: ${String(d.previousEmail)}` : undefined };
    }
    case 'USER_CREATED': return { text: `${who} creó al usuario ${target}` };
    case 'USER_PASSWORD_RESET': return { text: `${who} restableció la clave de ${target}` };
    case 'USER_ACTIVATED': return { text: `${who} activó a ${target}` };
    case 'USER_DEACTIVATED': return { text: `${who} desactivó a ${target}` };
    case 'USER_DELETED': {
      const r = (d.removed ?? {}) as { transactions?: number; accounts?: number; goals?: number };
      return { text: `${who} eliminó permanentemente a ${target}`, note: `${r.transactions ?? 0} movimientos, ${r.accounts ?? 0} cuentas, ${r.goals ?? 0} metas` };
    }
    case 'ACCESS_DENIED': return { text: `${who} intentó entrar a una sección de administración`, note: d.path ? String(d.path) : undefined };
  }
}

/** Navegador y sistema a partir del user-agent (aproximado, solo para mostrar). */
function device(ua: string | null) {
  if (!ua) return null;
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null;
  return [browser, os].filter(Boolean).join(' · ') || 'Otro';
}

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA');
function dayLabel(iso: string) {
  const key = dayKey(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 864e5);
  if (key === today.toLocaleDateString('en-CA')) return 'Hoy';
  if (key === yesterday.toLocaleDateString('en-CA')) return 'Ayer';
  return new Date(iso).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface Filters { search: string; action: '' | AuditAction; from: string; to: string }
const EMPTY: Filters = { search: '', action: '', from: '', to: '' };

function toQuery(f: Filters, page: number) {
  const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (f.search.trim()) q.set('search', f.search.trim());
  if (f.action) q.set('action', f.action);
  if (f.from) q.set('from', new Date(`${f.from}T00:00:00`).toISOString());
  if (f.to) q.set('to', new Date(`${f.to}T23:59:59`).toISOString());
  return q.toString();
}

export default function Audit() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const list = useLoad<Page<AuditEntry>>(`/admin/audit?${toQuery(useDebounce(filters), page)}`);
  const summary = useLoad<AuditSummary>('/admin/audit/summary');
  const s = summary.data;
  const set = (key: keyof Filters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFilters({ ...filters, [key]: e.target.value }); setPage(1); };
  const filtered = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const suspicious = s?.topFailed.filter((t) => t.count >= 3) ?? [];

  // Agrupar por día para leer la bitácora como una línea de tiempo.
  const groups: { label: string; items: AuditEntry[] }[] = [];
  for (const e of list.data?.items ?? []) {
    const label = dayLabel(e.createdAt);
    if (groups.at(-1)?.label === label) groups.at(-1)!.items.push(e); else groups.push({ label, items: [e] });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bitácora</h1>
          <p className="mt-1 text-sm text-muted">Accesos y acciones de administración. No incluye montos ni movimientos de los usuarios.</p>
        </div>
        <button className={`${secondaryButton} flex items-center gap-2`} onClick={() => { list.reload(); summary.reload(); }}>
          <RefreshCw size={16} aria-hidden />Actualizar
        </button>
      </header>

      {s && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Eventos · 24 h" value={String(s.events24h)} icon={Activity} />
          <StatCard label="Ingresos fallidos · 24 h" value={String(s.failed24h)} icon={ShieldAlert} tone={s.failed24h ? 'danger' : 'brand'} />
          <StatCard label="Accesos denegados · 7 días" value={String(s.denied7d)} icon={ShieldX} tone={s.denied7d ? 'danger' : 'brand'} />
          <StatCard label="Acciones de admin · 7 días" value={String(s.admin7d)} icon={UserCog} />
        </div>
      )}

      {suspicious.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-card border border-danger/20 bg-danger/5 p-4 text-sm">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-medium text-danger">Varios intentos fallidos en las últimas 24 horas</p>
            <p className="mt-1 text-muted">
              {suspicious.map((t, i) => (
                <span key={t.email}>{i > 0 && ', '}
                  <button className="font-medium text-fg underline-offset-2 hover:underline" onClick={() => { setFilters({ ...EMPTY, search: t.email, action: 'LOGIN_FAILED' }); setPage(1); }}>{t.email}</button> ({t.count})
                </span>
              ))}. Si no reconoces estos intentos, revisa esas cuentas.
            </p>
          </div>
        </div>
      )}

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr_auto] lg:items-end">
          <Field label="Buscar"><input type="search" value={filters.search} onChange={set('search')} placeholder="Correo o IP" className={inputClass} /></Field>
          <Field label="Evento">
            <select value={filters.action} onChange={set('action')} className={inputClass}>
              <option value="">Todos</option>
              {(Object.keys(ACTIONS) as AuditAction[]).map((a) => <option key={a} value={a}>{ACTIONS[a].label}</option>)}
            </select>
          </Field>
          <Field label="Desde"><input type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} className={inputClass} /></Field>
          <Field label="Hasta"><input type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} className={inputClass} /></Field>
          <button className={`${secondaryButton} disabled:invisible`} disabled={!filtered} onClick={() => { setFilters(EMPTY); setPage(1); }}>Limpiar</button>
        </div>
      </Card>

      <Card>
        {list.error && <p role="alert" className="text-danger">{list.error}</p>}
        {!list.data && !list.error && <p className="text-muted">Cargando…</p>}
        {list.data?.items.length === 0 && (
          <EmptyState title={filtered ? 'Sin resultados' : 'Todavía no hay eventos'} hint={filtered ? 'Prueba con otros filtros.' : 'Aquí aparecerán los accesos y las acciones de administración.'} />
        )}
        {groups.map((g) => (
          <section key={g.label} className="[&+&]:mt-6">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted first-letter:uppercase">{g.label}</h2>
            <ul className="divide-y divide-line">
              {g.items.map((e) => {
                const meta = ACTIONS[e.action];
                const { text, note } = describe(e);
                const Icon = meta.icon;
                return (
                  <li key={e.id} className="flex items-start gap-3 py-3">
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${TONE[meta.tone]}`}><Icon size={16} aria-hidden /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="break-words">{text}</span>
                        {note && <span className="text-muted"> · {note}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[meta.label, e.ip, device(e.userAgent)].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <time dateTime={e.createdAt} className="shrink-0 text-xs tabular-nums text-muted">
                      {new Date(e.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {list.data && <Pagination page={page} total={list.data.total} pageSize={PAGE_SIZE} onPage={setPage} noun="eventos" />}
      </Card>
    </div>
  );
}
