import { useState, type FormEvent } from 'react';
import { useConfirm } from '../components/Confirm';
import { Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { ROLE_LABEL } from '../components/Header';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Card } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import type { AdminUser } from '../types';

const action = 'rounded-lg px-2 py-1 text-sm text-muted hover:bg-line/40 hover:text-fg';

export default function Users({ meId }: { meId: string }) {
  const { data, error, reload } = useLoad<AdminUser[]>('/admin/users');
  const toast = useToast();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AdminUser | null>(null);

  async function run(request: Promise<unknown>, success: string) {
    try { await request; toast.success(success); reload(); return true; } catch (err) { toast.error((err as Error).message); return false; }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (await run(api('/admin/users', { method: 'POST', body: { name: f.get('name'), email: f.get('email'), password: f.get('password') } }), 'Usuario creado')) setCreating(false);
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
      {error && <p role="alert" className="text-danger">{error}</p>}
      <Card>
        <ul className="divide-y divide-line">
          {data?.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.name || u.email}</p>
                <p className="truncate text-sm text-muted">{u.email} · desde {new Date(u.createdAt).toLocaleDateString('es-EC')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs text-brand">{ROLE_LABEL[u.role]}</span>
                {u.mustChangePassword && <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">Clave temporal</span>}
                {!u.active && <span className="rounded-full bg-danger/15 px-3 py-1 text-xs text-danger">Inactivo</span>}
                <button className={action} onClick={() => setResetting(u)}>Restablecer clave</button>
                {u.id !== meId && <button className={action} onClick={() => toggle(u)}>{u.active ? 'Desactivar' : 'Activar'}</button>}
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
