import type { FormEvent } from 'react';
import { ROLE_LABEL } from '../components/Header';
import { Field, inputClass, primaryButton } from '../components/Field';
import { useToast } from '../components/Toast';
import { Card } from '../components/ui';
import { api } from '../lib/api';
import type { User } from '../types';

export default function Profile({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const toast = useToast();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try { onUpdated(await api<User>('/auth/me', { method: 'PATCH', body: { name: f.get('name'), email: f.get('email') } })); toast.success('Perfil actualizado'); }
    catch (err) { toast.error((err as Error).message); }
  }
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre"><input name="name" required maxLength={60} defaultValue={user.name ?? ''} className={inputClass} /></Field>
          <Field label="Correo"><input name="email" type="email" required defaultValue={user.email} className={inputClass} /></Field>
          <div className="flex items-center justify-between sm:col-span-2">
            <span className="rounded-full bg-brand/15 px-3 py-1 text-sm text-brand">{ROLE_LABEL[user.role]}</span>
            <button className={primaryButton}>Guardar cambios</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
