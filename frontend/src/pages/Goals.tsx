import { useState, type FormEvent } from 'react';
import { DeleteButton } from '../components/DeleteButton';
import { EditButton } from '../components/EditButton';
import { Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { useToast } from '../components/Toast';
import { Card, EmptyState, ProgressBar } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Goal } from '../types';

export default function Goals() {
  const { data, error, reload } = useLoad<Goal[]>('/goals');
  const toast = useToast();
  const [editing, setEditing] = useState<Goal | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const date = f.get('targetDate') as string;
    const body = { name: f.get('name'), target: f.get('target'), targetDate: date ? new Date(`${date}T12:00:00`).toISOString() : undefined };
    try {
      if (editing) await api(`/goals/${editing.id}`, { method: 'PUT', body });
      else await api('/goals', { method: 'POST', body });
      toast.success(editing ? 'Meta actualizada' : 'Meta creada');
      setEditing(null); reload();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta meta?')) return;
    try { await api(`/goals/${id}`, { method: 'DELETE' }); toast.success('Meta eliminada'); if (editing?.id === id) setEditing(null); reload(); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Metas</h1>
      <Card>
        {editing && <p className="mb-4 text-sm text-brand">Editando: {editing.name}</p>}
        <form key={editing?.id ?? 'new'} onSubmit={submit} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <Field label="Nombre"><input name="name" required maxLength={80} defaultValue={editing?.name} className={inputClass} /></Field>
          <Field label="Monto objetivo"><input name="target" required inputMode="decimal" pattern="\d{1,12}(\.\d{1,2})?" placeholder="0.00" defaultValue={editing?.target} className={inputClass} /></Field>
          <Field label="Fecha objetivo (opcional)"><input name="targetDate" type="date" defaultValue={editing?.targetDate?.slice(0, 10)} className={inputClass} /></Field>
          <div className="flex items-center gap-3">
            <button className={primaryButton}>{editing ? 'Guardar cambios' : 'Crear meta'}</button>
            {editing && <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>Cancelar</button>}
          </div>
        </form>
      </Card>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data?.length === 0 && <Card><EmptyState title="Sin metas todavía" hint="Crea una y aporta desde la sección Ahorros." /></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((g) => (
          <Card key={g.id} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{g.name}</h2>
              <span className="flex items-center gap-3">
                <span className="tabular-nums text-brand">{g.percent}%</span>
                <EditButton label={g.name} onClick={() => { setEditing(g); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                <DeleteButton label={g.name} onClick={() => remove(g.id)} />
              </span>
            </div>
            <ProgressBar value={Number(g.percent)} label={g.name} />
            <p className="text-sm tabular-nums text-muted">{formatMoney(g.current)} / {formatMoney(g.target)} · Faltan {formatMoney(g.remaining)}</p>
            {g.monthlyNeeded && <p className="text-sm text-muted">Para llegar a la fecha, necesitarías ahorrar aprox. {formatMoney(g.monthlyNeeded)} al mes.</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
