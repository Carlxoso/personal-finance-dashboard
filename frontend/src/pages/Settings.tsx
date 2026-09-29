import { useState, type FormEvent } from 'react';
import { DeleteButton } from '../components/DeleteButton';
import { Field, inputClass, primaryButton } from '../components/Field';
import { Card } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import type { Category, User } from '../types';

const KINDS = [['EXPENSE', 'Gastos'], ['INCOME', 'Ingresos']] as const;

export default function Settings() {
  const me = useLoad<User>('/auth/me').data;
  const cats = useLoad<Category[]>('/categories');
  const [pwd, setPwd] = useState<{ ok: boolean; msg: string } | null>(null);
  const [catError, setCatError] = useState('');

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try { await api('/auth/password', { method: 'POST', body: { current: f.get('current'), next: f.get('next') } }); form.reset(); setPwd({ ok: true, msg: 'Contraseña actualizada' }); }
    catch (err) { setPwd({ ok: false, msg: (err as Error).message }); }
  }

  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try { await api('/categories', { method: 'POST', body: { name: f.get('name'), kind: f.get('kind') } }); form.reset(); setCatError(''); cats.reload(); }
    catch (err) { setCatError((err as Error).message); }
  }

  async function removeCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try { await api(`/categories/${id}`, { method: 'DELETE' }); setCatError(''); cats.reload(); }
    catch (err) { setCatError((err as Error).message); }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <Card>
        <h2 className="font-medium">Cuenta</h2>
        <p className="mt-2 text-sm text-muted">Correo: <span className="text-fg">{me?.email ?? '…'}</span></p>
      </Card>
      <Card>
        <h2 className="mb-4 font-medium">Cambiar contraseña</h2>
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <Field label="Contraseña actual"><input name="current" type="password" required autoComplete="current-password" className={inputClass} /></Field>
          <Field label="Nueva (mínimo 10 caracteres)"><input name="next" type="password" required minLength={10} autoComplete="new-password" className={inputClass} /></Field>
          <button className={primaryButton}>Actualizar</button>
        </form>
        {pwd && <p role={pwd.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${pwd.ok ? 'text-brand' : 'text-danger'}`}>{pwd.msg}</p>}
      </Card>
      <Card>
        <h2 className="mb-4 font-medium">Categorías</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {KINDS.map(([kind, label]) => (
            <div key={kind}>
              <h3 className="mb-2 text-sm text-muted">{label}</h3>
              <ul className="divide-y divide-line">
                {cats.data?.filter((c) => c.kind === kind).map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">{c.name}<DeleteButton label={c.name} onClick={() => removeCategory(c.id)} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <form onSubmit={addCategory} className="mt-6 grid gap-4 sm:grid-cols-3 sm:items-end">
          <Field label="Nombre"><input name="name" required maxLength={40} className={inputClass} /></Field>
          <Field label="Tipo"><select name="kind" className={inputClass}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <button className={primaryButton}>Agregar categoría</button>
        </form>
        {catError && <p role="alert" className="mt-3 text-sm text-danger">{catError}</p>}
      </Card>
    </div>
  );
}
