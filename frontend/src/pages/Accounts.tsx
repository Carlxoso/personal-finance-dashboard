import { useState, type FormEvent } from 'react';
import { DeleteButton } from '../components/DeleteButton';
import { EditButton } from '../components/EditButton';
import { Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { useToast } from '../components/Toast';
import { Card, EmptyState } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Account } from '../types';

export default function Accounts() {
  const { data, error, reload } = useLoad<Account[]>('/accounts');
  const toast = useToast();
  const [editing, setEditing] = useState<Account | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { name: f.get('name'), type: f.get('type'), initialBalance: f.get('initialBalance') || '0' };
    try {
      if (editing) await api(`/accounts/${editing.id}`, { method: 'PUT', body });
      else await api('/accounts', { method: 'POST', body });
      toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada');
      setEditing(null); reload();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    try { await api(`/accounts/${id}`, { method: 'DELETE' }); toast.success('Cuenta eliminada'); if (editing?.id === id) setEditing(null); reload(); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cuentas</h1>
      <Card>
        {editing && <p className="mb-4 text-sm text-brand">Editando: {editing.name}</p>}
        <form key={editing?.id ?? 'new'} onSubmit={submit} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <Field label="Nombre"><input name="name" required maxLength={60} defaultValue={editing?.name} className={inputClass} /></Field>
          <Field label="Tipo">
            <select name="type" defaultValue={editing?.type} className={inputClass}><option>Banco</option><option>Cuenta digital</option><option>Efectivo</option></select>
          </Field>
          <Field label="Saldo inicial"><input name="initialBalance" inputMode="decimal" pattern="-?\d{1,12}(\.\d{1,2})?" placeholder="0.00" defaultValue={editing?.initialBalance} className={inputClass} /></Field>
          <div className="flex items-center gap-3">
            <button className={primaryButton}>{editing ? 'Guardar cambios' : 'Crear cuenta'}</button>
            {editing && <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>Cancelar</button>}
          </div>
        </form>
      </Card>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data?.length === 0 && <Card><EmptyState title="Sin cuentas todavía" hint="Crea una para empezar a registrar movimientos." /></Card>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted">{a.type}</p>
              <span className="flex items-center gap-3"><EditButton label={a.name} onClick={() => { setEditing(a); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /><DeleteButton label={a.name} onClick={() => remove(a.id)} /></span>
            </div>
            <p className="mt-1 font-medium">{a.name}</p>
            <p className={`mt-3 text-2xl font-semibold tabular-nums ${Number(a.balance) < 0 ? 'text-danger' : ''}`}>{formatMoney(a.balance)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
