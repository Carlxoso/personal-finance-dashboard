import { Trash2 } from 'lucide-react';
import { formatMoney } from '../lib/format';
import type { Transaction, TxType } from '../types';

export const LABELS: Record<TxType, string> = { INCOME: 'Ingreso', EXPENSE: 'Gasto', TRANSFER: 'Transferencia', SAVING: 'Ahorro' };
const SIGN: Record<TxType, string> = { INCOME: '+', EXPENSE: '−', TRANSFER: '', SAVING: '' };
const TONE: Record<TxType, string> = { INCOME: 'text-brand', SAVING: 'text-brand', EXPENSE: 'text-danger', TRANSFER: '' };

export function TransactionItem({ t, onDelete }: { t: Transaction; onDelete?: (id: string) => void }) {
  const where = t.toAccount ? `${t.account.name} → ${t.toAccount.name}` : t.account.name;
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{t.description}</p>
        <p className="text-sm text-muted">{[LABELS[t.type], t.category?.name, where, new Date(t.date).toLocaleDateString('es-EC')].filter(Boolean).join(' · ')}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`tabular-nums ${TONE[t.type]}`}>{SIGN[t.type]}{formatMoney(t.amount)}</span>
        {onDelete && (
          <button onClick={() => onDelete(t.id)} aria-label={`Eliminar ${t.description}`} className="text-muted hover:text-danger"><Trash2 size={16} aria-hidden /></button>
        )}
      </div>
    </li>
  );
}
