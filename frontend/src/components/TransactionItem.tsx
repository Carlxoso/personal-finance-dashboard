import { formatMoney } from '../lib/format';
import type { Transaction, TxType } from '../types';
import { DeleteButton } from './DeleteButton';
import { EditButton } from './EditButton';

export const LABELS: Record<TxType, string> = { INCOME: 'Ingreso', EXPENSE: 'Gasto', TRANSFER: 'Transferencia', SAVING: 'Ahorro' };
const SIGN: Record<TxType, string> = { INCOME: '+', EXPENSE: '−', TRANSFER: '', SAVING: '' };
const TONE: Record<TxType, string> = { INCOME: 'text-brand', SAVING: 'text-brand', EXPENSE: 'text-danger', TRANSFER: '' };

export function TransactionItem({ t, onEdit, onDelete }: { t: Transaction; onEdit?: (t: Transaction) => void; onDelete?: (id: string) => void }) {
  const where = t.toAccount ? `${t.account.name} → ${t.toAccount.name}` : t.account.name;
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{t.description}</p>
        <p className="text-sm text-muted">{[LABELS[t.type], t.category?.name, where, new Date(t.date).toLocaleDateString('es-EC')].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`tabular-nums ${TONE[t.type]}`}>{SIGN[t.type]}{formatMoney(t.amount)}</span>
        {onEdit && <EditButton label={t.description} onClick={() => onEdit(t)} />}
        {onDelete && <DeleteButton label={t.description} onClick={() => onDelete(t.id)} />}
      </div>
    </li>
  );
}
