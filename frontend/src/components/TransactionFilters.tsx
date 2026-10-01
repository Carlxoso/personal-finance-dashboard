import type { ChangeEvent } from 'react';
import type { Account, Category, TxType } from '../types';
import { LABELS } from './TransactionItem';
import { Field, inputClass } from './Field';

export interface Filters { search: string; type: '' | TxType; accountId: string; categoryId: string; from: string; to: string }
export const EMPTY_FILTERS: Filters = { search: '', type: '', accountId: '', categoryId: '', from: '', to: '' };

export function TransactionFilters({ value, onChange, accounts, categories, showType }: {
  value: Filters; onChange: (f: Filters) => void; accounts: Account[]; categories: Category[]; showType: boolean;
}) {
  const set = (key: keyof Filters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [key]: e.target.value });
  const visible = categories.filter((c) => value.type !== 'INCOME' && value.type !== 'EXPENSE' ? true : c.kind === value.type);
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Field label="Buscar"><input type="search" value={value.search} onChange={set('search')} placeholder="Descripción" className={inputClass} /></Field>
      {showType && (
        <Field label="Tipo"><select value={value.type} onChange={set('type')} className={inputClass}>
          <option value="">Todos</option>{(Object.keys(LABELS) as TxType[]).map((t) => <option key={t} value={t}>{LABELS[t]}</option>)}</select></Field>
      )}
      <Field label="Cuenta"><select value={value.accountId} onChange={set('accountId')} className={inputClass}>
        <option value="">Todas</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
      <Field label="Categoría"><select value={value.categoryId} onChange={set('categoryId')} className={inputClass}>
        <option value="">Todas</option>{visible.map((c) => <option key={c.id} value={c.id}>{c.name}{c.kind === 'INCOME' ? ' (ingreso)' : ' (gasto)'}</option>)}</select></Field>
      <Field label="Desde"><input type="date" value={value.from} onChange={set('from')} className={inputClass} /></Field>
      <Field label="Hasta"><input type="date" value={value.to} onChange={set('to')} className={inputClass} /></Field>
    </div>
  );
}
