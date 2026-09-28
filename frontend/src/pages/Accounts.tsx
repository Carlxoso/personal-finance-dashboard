import { useState, type FormEvent } from 'react';
import { Field, inputClass, primaryButton } from '../components/Field';
import { Card, EmptyState } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Account } from '../types';

export default function Accounts() {
  const { data, error, reload } = useLoad<Account[]>('/accounts');
  const [formError, setFormError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      await api('/accounts', { method: 'POST', body: { name: f.get('name'), type: f.get('type'), initialBalance: f.get('initialBalance') || '0' } });
      form.reset(); setFormError(''); reload();
    } catch (err) { setFormError((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cuentas</h1>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <Field label="Nombre"><input name="name" required maxLength={60} className={inputClass} /></Field>
          <Field label="Tipo">
            <select name="type" className={inputClass}><option>Banco</option><option>Cuenta digital</option><option>Efectivo</option></select>
          </Field>
          <Field label="Saldo inicial"><input name="initialBalance" inputMode="decimal" pattern="-?\d{1,12}(\.\d{1,2})?" placeholder="0.00" className={inputClass} /></Field>
          <button className={primaryButton}>Crear cuenta</button>
        </form>
        {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}
      </Card>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data?.length === 0 && <Card><EmptyState title="Sin cuentas todavía" hint="Crea una para empezar a registrar movimientos." /></Card>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((a) => (
          <Card key={a.id}>
            <p className="text-sm text-muted">{a.type}</p>
            <p className="mt-1 font-medium">{a.name}</p>
            <p className={`mt-3 text-2xl font-semibold tabular-nums ${Number(a.balance) < 0 ? 'text-danger' : ''}`}>{formatMoney(a.balance)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
