import { useState, type FormEvent } from 'react';
import { Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { EMPTY_FILTERS, TransactionFilters, type Filters } from '../components/TransactionFilters';
import { LABELS, TransactionItem } from '../components/TransactionItem';
import { Card, EmptyState } from '../components/ui';
import { useDebounce } from '../hooks/useDebounce';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import type { Account, Category, Goal, Page, Transaction, TxType } from '../types';

const PAGE_SIZE = 20;
const FORM_TYPES: TxType[] = ['INCOME', 'EXPENSE', 'TRANSFER', 'SAVING'];
const dateInput = (d: Date) => d.toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local

function toQuery(f: Filters, page: number, fixed?: TxType) {
  const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  const type = fixed ?? f.type;
  if (type) q.set('type', type);
  if (f.search.trim()) q.set('search', f.search.trim());
  if (f.accountId) q.set('accountId', f.accountId);
  if (f.categoryId) q.set('categoryId', f.categoryId);
  if (f.from) q.set('from', new Date(`${f.from}T00:00:00`).toISOString());
  if (f.to) q.set('to', new Date(`${f.to}T23:59:59`).toISOString());
  return q.toString();
}

export default function Transactions({ type: fixed, title }: { type?: 'INCOME' | 'EXPENSE' | 'SAVING'; title: string }) {
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [type, setType] = useState<TxType>(fixed ?? 'EXPENSE');
  const list = useLoad<Page<Transaction>>(`/transactions?${toQuery(useDebounce(filters), page, fixed)}`);
  const accounts = useLoad<Account[]>('/accounts').data;
  const categories = useLoad<Category[]>('/categories').data;
  const goals = useLoad<Goal[]>('/goals').data;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const opt = (k: string) => (f.get(k) as string) || undefined;
    const body = {
      type, amount: f.get('amount'), description: f.get('description'), notes: opt('notes'),
      date: new Date(`${f.get('date')}T12:00:00`).toISOString(), accountId: f.get('accountId'),
      toAccountId: type === 'TRANSFER' ? opt('toAccountId') : undefined,
      categoryId: type === 'TRANSFER' || type === 'SAVING' ? undefined : opt('categoryId'),
      goalId: type === 'SAVING' ? opt('goalId') : undefined,
    };
    try {
      if (editing) await api(`/transactions/${editing.id}`, { method: 'PUT', body });
      else await api('/transactions', { method: 'POST', body });
      toast.success(editing ? 'Movimiento actualizado' : 'Movimiento registrado');
      stopEditing(); list.reload();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try { await api(`/transactions/${id}`, { method: 'DELETE' }); toast.success('Movimiento eliminado'); if (editing?.id === id) stopEditing(); list.reload(); }
    catch (err) { toast.error((err as Error).message); }
  }
  function startEditing(t: Transaction) { setType(t.type); setEditing(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function stopEditing() { setEditing(null); setType(fixed ?? 'EXPENSE'); }

  if (accounts?.length === 0) return <Card><EmptyState title="Primero crea una cuenta" hint="Los movimientos se registran dentro de una cuenta." /></Card>;
  const e = editing;
  const kindCategories = categories?.filter((c) => c.kind === type) ?? [];
  const accountOptions = accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        {e && <p className="mb-4 text-sm text-brand">Editando: {e.description}</p>}
        <form key={e?.id ?? 'new'} onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          {!fixed && (
            <Field label="Tipo"><select value={type} onChange={(ev) => setType(ev.target.value as TxType)} className={inputClass}>
              {FORM_TYPES.map((t) => <option key={t} value={t}>{LABELS[t]}</option>)}</select></Field>
          )}
          <Field label="Monto"><input name="amount" required inputMode="decimal" pattern="\d{1,12}(\.\d{1,2})?" placeholder="0.00" defaultValue={e?.amount} className={inputClass} /></Field>
          <Field label="Descripción"><input name="description" required maxLength={120} defaultValue={e?.description} className={inputClass} /></Field>
          <Field label="Fecha"><input name="date" type="date" required defaultValue={dateInput(e ? new Date(e.date) : new Date())} className={inputClass} /></Field>
          <Field label={type === 'TRANSFER' ? 'Cuenta de origen' : 'Cuenta'}><select name="accountId" required defaultValue={e?.accountId} className={inputClass}>{accountOptions}</select></Field>
          {type === 'TRANSFER' ? (
            <Field label="Cuenta de destino"><select name="toAccountId" required defaultValue={e?.toAccountId ?? undefined} className={inputClass}>{accountOptions}</select></Field>
          ) : type === 'SAVING' ? (
            <Field label="Meta"><select name="goalId" required defaultValue={e?.goalId ?? undefined} className={inputClass}>{goals?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
          ) : (
            <Field label="Categoría"><select name="categoryId" required defaultValue={e?.categoryId ?? undefined} className={inputClass}>{kindCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          )}
          <Field label="Notas (opcional)"><input name="notes" maxLength={500} defaultValue={e?.notes ?? ''} className={inputClass} /></Field>
          <div className="flex items-end gap-3">
            <button className={primaryButton}>{e ? 'Guardar cambios' : `Registrar ${LABELS[type].toLowerCase()}`}</button>
            {e && <button type="button" onClick={stopEditing} className={secondaryButton}>Cancelar</button>}
          </div>
        </form>
      </Card>
      <Card>
        <TransactionFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} accounts={accounts ?? []} categories={categories ?? []} showType={!fixed} />
      </Card>
      {list.error && <p role="alert" className="text-danger">{list.error}</p>}
      <Card>
        {list.data?.items.length === 0 ? <EmptyState title="Sin movimientos" hint="Registra uno o cambia los filtros." /> : (
          <ul className="divide-y divide-line">{list.data?.items.map((t) => <TransactionItem key={t.id} t={t} onEdit={startEditing} onDelete={remove} />)}</ul>
        )}
        {list.data && <Pagination page={page} total={list.data.total} pageSize={PAGE_SIZE} onPage={setPage} />}
      </Card>
    </div>
  );
}
