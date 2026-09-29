import { useState, type FormEvent } from 'react';
import { DeleteButton } from '../components/DeleteButton';
import { Field, inputClass, primaryButton } from '../components/Field';
import { Card, EmptyState, ProgressBar } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Goal } from '../types';

export default function Goals() {
  const { data, error, reload } = useLoad<Goal[]>('/goals');
  const [formError, setFormError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const date = f.get('targetDate') as string;
    try {
      await api('/goals', { method: 'POST', body: { name: f.get('name'), target: f.get('target'), targetDate: date ? new Date(`${date}T12:00:00`).toISOString() : undefined } });
      form.reset(); setFormError(''); reload();
    } catch (err) { setFormError((err as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return;
    try { await api(`/goals/${id}`, { method: 'DELETE' }); setFormError(''); reload(); }
    catch (err) { setFormError((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Metas</h1>
      <Card>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <Field label="Nombre"><input name="name" required maxLength={80} className={inputClass} /></Field>
          <Field label="Monto objetivo"><input name="target" required inputMode="decimal" pattern="\d{1,12}(\.\d{1,2})?" placeholder="0.00" className={inputClass} /></Field>
          <Field label="Fecha objetivo (opcional)"><input name="targetDate" type="date" className={inputClass} /></Field>
          <button className={primaryButton}>Crear meta</button>
        </form>
        {formError && <p role="alert" className="mt-3 text-sm text-danger">{formError}</p>}
      </Card>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data?.length === 0 && <Card><EmptyState title="Sin metas todavía" hint="Crea una y aporta desde la sección Ahorros." /></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((g) => (
          <Card key={g.id} className="space-y-3">
            <div className="flex items-baseline justify-between"><h2 className="font-medium">{g.name}</h2><span className="flex items-center gap-3"><span className="text-brand tabular-nums">{g.percent}%</span><DeleteButton label={g.name} onClick={() => remove(g.id)} /></span></div>
            <ProgressBar value={Number(g.percent)} label={g.name} />
            <p className="text-sm text-muted tabular-nums">{formatMoney(g.current)} / {formatMoney(g.target)} · Faltan {formatMoney(g.remaining)}</p>
            {g.monthlyNeeded && <p className="text-sm text-muted">Para llegar a la fecha, necesitarías ahorrar aprox. {formatMoney(g.monthlyNeeded)} al mes.</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
