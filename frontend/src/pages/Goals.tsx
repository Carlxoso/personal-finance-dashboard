import { useState, type FormEvent } from 'react';
import { useConfirm } from '../components/Confirm';
import { DeleteButton } from '../components/DeleteButton';
import { EditButton } from '../components/EditButton';
import { Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Card, EmptyState, ProgressBar } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Goal } from '../types';

export default function Goals() {
  const { data, error, reload } = useLoad<Goal[]>('/goals');
  const toast = useToast();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const close = () => { setOpen(false); setEditing(null); };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const date = f.get('targetDate') as string;
    const body = { name: f.get('name'), target: f.get('target'), targetDate: date ? new Date(`${date}T12:00:00`).toISOString() : undefined };
    try {
      if (editing) await api(`/goals/${editing.id}`, { method: 'PUT', body });
      else await api('/goals', { method: 'POST', body });
      toast.success(editing ? 'Meta actualizada' : 'Meta creada');
      close(); reload();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function remove(g: Goal) {
    if (!(await confirm({ title: 'Eliminar meta', message: `¿Seguro que quieres eliminar "${g.name}"? Solo se puede si no tiene aportes.`, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/goals/${g.id}`, { method: 'DELETE' }); toast.success('Meta eliminada'); reload(); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Metas</h1>
        <button onClick={() => setOpen(true)} className={primaryButton}>+ Nueva meta</button>
      </header>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data?.length === 0 && <Card><EmptyState title="Sin metas todavía" hint="Crea una y aporta desde la sección Ahorros." /></Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((g) => (
          <Card key={g.id} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{g.name}</h2>
              <span className="flex items-center gap-3">
                <span className="tabular-nums text-brand">{g.percent}%</span>
                <EditButton label={g.name} onClick={() => { setEditing(g); setOpen(true); }} />
                <DeleteButton label={g.name} onClick={() => remove(g)} />
              </span>
            </div>
            <ProgressBar value={Number(g.percent)} label={g.name} />
            <p className="text-sm tabular-nums text-muted">{formatMoney(g.current)} / {formatMoney(g.target)} · Faltan {formatMoney(g.remaining)}</p>
            {g.monthlyNeeded && <p className="text-sm text-muted">Para llegar a la fecha, necesitarías ahorrar aprox. {formatMoney(g.monthlyNeeded)} al mes.</p>}
          </Card>
        ))}
      </div>
      {open && (
        <Modal title={editing ? 'Editar meta' : 'Nueva meta'} onClose={close} width="max-w-lg">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><input name="name" required maxLength={80} defaultValue={editing?.name} className={inputClass} /></Field>
            <Field label="Monto objetivo"><input name="target" required inputMode="decimal" pattern="\d{1,12}(\.\d{1,2})?" placeholder="0.00" defaultValue={editing?.target} className={inputClass} /></Field>
            <Field label="Fecha objetivo (opcional)"><input name="targetDate" type="date" defaultValue={editing?.targetDate?.slice(0, 10)} className={inputClass} /></Field>
            <div className="flex items-end justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={close} className={secondaryButton}>Cancelar</button>
              <button className={primaryButton}>{editing ? 'Guardar cambios' : 'Crear meta'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
