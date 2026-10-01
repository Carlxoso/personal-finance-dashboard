import type { FormEvent } from 'react';
import { Field, inputClass, primaryButton } from '../components/Field';
import { ROLE_LABEL } from '../components/Header';
import { useToast } from '../components/Toast';
import { Card } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import type { AdminUser } from '../types';

const action = 'rounded-lg px-2 py-1 text-sm text-muted hover:bg-line/40 hover:text-fg';

export default function Users({ meId }: { meId: string }) {
  const { data, error, reload } = useLoad<AdminUser[]>('/admin/users');
  const toast = useToast();

  async function run(request: Promise<unknown>, success: string) {
    try { await request; toast.success(success); reload(); } catch (err) { toast.error((err as Error).message); }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    await run(api('/admin/users', { method: 'POST', body: { name: f.get('name'), email: f.get('email'), password: f.get('password') } }), 'Usuario creado');
    form.reset();
  }
  function resetPassword(u: AdminUser) {
    const password = window.prompt(`Nueva contraseña temporal para ${u.email} (mínimo 10 caracteres)`);
    if (password) void run(api(`/admin/users/${u.id}/password`, { method: 'POST', body: { password } }), 'Contraseña actualizada');
  }
  const toggle = (u: AdminUser) => run(api(`/admin/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } }), u.active ? 'Usuario desactivado' : 'Usuario activado');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      <Card>
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <Field label="Nombre"><input name="name" required maxLength={60} className={inputClass} /></Field>
          <Field label="Correo"><input name="email" type="email" required className={inputClass} /></Field>
          <Field label="Contraseña temporal"><input name="password" type="password" required minLength={10} autoComplete="new-password" className={inputClass} /></Field>
          <button className={primaryButton}>Crear usuario</button>
        </form>
      </Card>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <Card>
        <ul className="divide-y divide-line">
          {data?.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name || u.email}</p>
                <p className="truncate text-sm text-muted">{u.email} · desde {new Date(u.createdAt).toLocaleDateString('es-EC')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs text-brand">{ROLE_LABEL[u.role]}</span>
                {!u.active && <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">Inactivo</span>}
                <button className={action} onClick={() => resetPassword(u)}>Restablecer clave</button>
                {u.id !== meId && <button className={action} onClick={() => toggle(u)}>{u.active ? 'Desactivar' : 'Activar'}</button>}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
