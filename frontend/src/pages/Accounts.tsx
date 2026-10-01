import { useState, type FormEvent } from 'react';
import { useConfirm } from '../components/Confirm';
import { DeleteButton } from '../components/DeleteButton';
import { EditButton } from '../components/EditButton';
import { Field, inputClass, primaryButton, secondaryButton } from '../components/Field';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { Card, EmptyState } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Account } from '../types';

export default function Accounts() {
  const { data, error, reload } = useLoad<Account[]>('/accounts');
  const toast = useToast();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const close = () => { setOpen(false); setEditing(null); };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { name: f.get('name'), type: f.get('type'), initialBalance: f.get('initialBalance') || '0' };
    try {
      if (editing) await api(`/accounts/${editing.id}`, { method: 'PUT', body });
      else await api('/accounts', { method: 'POST', body });
      toast.success(editing ? 'Cuenta actualizada' : 'Cuenta creada');
      close(); reload();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function remove(a: Account) {
    if (!(await confirm({ title: 'Eliminar cuenta', message: `¿Seguro que quieres eliminar "${a.name}"? Solo se puede si no tiene movimientos.`, confirmLabel: 'Eliminar' }))) return;
    try { await api(`/accounts/${a.id}`, { method: 'DELETE' }); toast.success('Cuenta eliminada'); reload(); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        <button onClick={() => setOpen(true)} className={primaryButton}>+ Nueva cuenta</button>
      </header>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data?.length === 0 && <Card><EmptyState title="Sin cuentas todavía" hint="Crea una para empezar a registrar movimientos." /></Card>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted">{a.type}</p>
              <span className="flex items-center gap-3"><EditButton label={a.name} onClick={() => { setEditing(a); setOpen(true); }} /><DeleteButton label={a.name} onClick={() => remove(a)} /></span>
            </div>
            <p className="mt-1 font-medium">{a.name}</p>
            <p className={`mt-3 text-2xl font-semibold tabular-nums ${Number(a.balance) < 0 ? 'text-danger' : ''}`}>{formatMoney(a.balance)}</p>
          </Card>
        ))}
      </div>
      {open && (
        <Modal title={editing ? 'Editar cuenta' : 'Nueva cuenta'} onClose={close} width="max-w-lg">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><input name="name" required maxLength={60} defaultValue={editing?.name} className={inputClass} /></Field>
            <Field label="Tipo"><select name="type" defaultValue={editing?.type} className={inputClass}><option>Banco</option><option>Cuenta digital</option><option>Efectivo</option></select></Field>
            <Field label="Saldo inicial"><input name="initialBalance" inputMode="decimal" pattern="-?\d{1,12}(\.\d{1,2})?" placeholder="0.00" defaultValue={editing?.initialBalance} className={inputClass} /></Field>
            <div className="flex items-end justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={close} className={secondaryButton}>Cancelar</button>
              <button className={primaryButton}>{editing ? 'Guardar cambios' : 'Crear cuenta'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
