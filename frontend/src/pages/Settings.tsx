import { useState, type FormEvent } from 'react';
import { DeleteButton } from '../components/DeleteButton';
import { Field, inputClass, primaryButton } from '../components/Field';
import { useConfirm } from '../components/Confirm';
import { useToast } from '../components/Toast';
import { Card } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import type { Category, User } from '../types';

const KINDS = [['EXPENSE', 'Gastos'], ['INCOME', 'Ingresos']] as const;

export default function Settings() {
  const me = useLoad<User>('/auth/me').data;
  const cats = useLoad<Category[]>('/categories');
  const toast = useToast();
  const confirm = useConfirm();

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try { await api('/auth/password', { method: 'POST', body: { current: f.get('current'), next: f.get('next') } }); form.reset(); toast.success('Contraseña actualizada'); }
    catch (err) { toast.error((err as Error).message); }
  }

  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try { await api('/categories', { method: 'POST', body: { name: f.get('name'), kind: f.get('kind') } }); form.reset(); toast.success('Categoría agregada'); cats.reload(); }
    catch (err) { toast.error((err as Error).message); }
  }

  async function removeCategory(id: string) {
    if (!(await confirm({ title: 'Eliminar categoría', message: '¿Seguro que quieres eliminar esta categoría?', confirmLabel: 'Eliminar' }))) return;
    try { await api(`/categories/${id}`, { method: 'DELETE' }); toast.success('Categoría eliminada'); cats.reload(); }
    catch (err) { toast.error((err as Error).message); }
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
      </Card>
    </div>
  );
}
