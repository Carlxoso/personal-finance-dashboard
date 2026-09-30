import { useToast } from '../components/Toast';
import { LABELS, TransactionItem } from '../components/TransactionItem';
import { useState, type FormEvent } from 'react';
import { Field, inputClass, primaryButton } from '../components/Field';
import { Card, EmptyState } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import type { Account, Category, Goal, Page, Transaction, TxType } from '../types';

const FORM_TYPES: TxType[] = ['INCOME', 'EXPENSE', 'TRANSFER', 'SAVING'];
const today = () => new Date().toISOString().slice(0, 10);

export default function Transactions({ type: fixed, title }: { type?: 'INCOME' | 'EXPENSE' | 'SAVING'; title: string }) {
  const list = useLoad<Page<Transaction>>(`/transactions?pageSize=50${fixed ? `&type=${fixed}` : ''}`);
  const accounts = useLoad<Account[]>('/accounts').data;
  const categories = useLoad<Category[]>('/categories').data;
  const goals = useLoad<Goal[]>('/goals').data;
  const [type, setType] = useState<TxType>(fixed ?? 'EXPENSE');
  const toast = useToast();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const opt = (k: string) => (f.get(k) as string) || undefined;
    try {
      await api('/transactions', { method: 'POST', body: {
        type, amount: f.get('amount'), description: f.get('description'), notes: opt('notes'),
        date: new Date(`${f.get('date')}T12:00:00`).toISOString(),
        accountId: f.get('accountId'), toAccountId: type === 'TRANSFER' ? opt('toAccountId') : undefined,
        categoryId: type === 'TRANSFER' || type === 'SAVING' ? undefined : opt('categoryId'),
        goalId: type === 'SAVING' ? opt('goalId') : undefined,
      } });
      form.reset(); toast.success('Movimiento registrado'); list.reload();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try { await api(`/transactions/${id}`, { method: 'DELETE' }); toast.success('Movimiento eliminado'); list.reload(); }
    catch (err) { toast.error((err as Error).message); }
  }

  if (accounts?.length === 0) return <Card><EmptyState title="Primero crea una cuenta" hint="Los movimientos se registran dentro de una cuenta." /></Card>;
  const kindCategories = categories?.filter((c) => c.kind === type) ?? [];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          {!fixed && (
            <Field label="Tipo"><select value={type} onChange={(e) => setType(e.target.value as TxType)} className={inputClass}>
              {FORM_TYPES.map((t) => <option key={t} value={t}>{LABELS[t]}</option>)}</select></Field>
          )}
          <Field label="Monto"><input name="amount" required inputMode="decimal" pattern="\d{1,12}(\.\d{1,2})?" placeholder="0.00" className={inputClass} /></Field>
          <Field label="Descripción"><input name="description" required maxLength={120} className={inputClass} /></Field>
          <Field label="Fecha"><input name="date" type="date" required defaultValue={today()} className={inputClass} /></Field>
          <Field label={type === 'TRANSFER' ? 'Cuenta de origen' : 'Cuenta'}>
            <select name="accountId" required className={inputClass}>{accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
          {type === 'TRANSFER' ? (
            <Field label="Cuenta de destino"><select name="toAccountId" required className={inputClass}>{accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
          ) : type === 'SAVING' ? (
            <Field label="Meta"><select name="goalId" required className={inputClass}>{goals?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
          ) : (
            <Field label="Categoría"><select name="categoryId" required className={inputClass}>{kindCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          )}
          <Field label="Notas (opcional)"><input name="notes" maxLength={500} className={inputClass} /></Field>
          <div className="flex items-end"><button className={primaryButton}>Registrar {LABELS[type].toLowerCase()}</button></div>
        </form>
      </Card>
      {list.error && <p role="alert" className="text-danger">{list.error}</p>}
      <Card>
        {list.data?.items.length === 0 ? <EmptyState title="Sin movimientos todavía" hint="Registra el primero con el formulario de arriba." /> : (
          <ul className="divide-y divide-line">
            {list.data?.items.map((t) => (
              <TransactionItem key={t.id} t={t} onDelete={remove} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
