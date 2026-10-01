import { PiggyBank, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { primaryButton, secondaryButton } from '../components/Field';
import { PeriodSelect } from '../components/PeriodSelect';
import { useToast } from '../components/Toast';
import { TransactionItem } from '../components/TransactionItem';
import { Card, EmptyState, StatCard } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { DEFAULT_PERIOD, formatMoney, periodLabel, rangeFor, type PeriodState } from '../lib/format';
import { downloadReportPdf } from '../lib/reportPdf';
import type { Page, PeriodSummary, Transaction, User } from '../types';

const cents = (v: string) => Math.round(Number(v) * 100); // cálculo en centavos para evitar errores de decimales

export default function Reports({ user }: { user: User }) {
  const toast = useToast();
  const [period, setPeriod] = useState<PeriodState>(DEFAULT_PERIOD);
  const range = useMemo(() => new URLSearchParams(rangeFor(period)).toString(), [period]);
  const summary = useLoad<PeriodSummary>(`/statistics/summary?${range}`);
  const txs = useLoad<Page<Transaction>>(`/transactions?pageSize=100&${range}`).data;
  const s = summary.data;
  const net = s ? ((cents(s.income) - cents(s.expense)) / 100).toFixed(2) : '0';
  const totalExpense = s ? cents(s.expense) : 0;

  function exportPdf() {
    if (s) downloadReportPdf({ user, periodLabel: periodLabel(period), summary: s, txs: txs ?? null });
  }

  async function exportExcel() {
    const res = await fetch(`/api/reports/export?${range}&label=${encodeURIComponent(periodLabel(period))}`, { credentials: 'include' });
    if (!res.ok) return toast.error('No se pudo exportar el reporte');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte-financiero.xlsx'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelect value={period} onChange={setPeriod} />
          <button onClick={exportExcel} className={secondaryButton}>Exportar Excel</button>
          <button onClick={exportPdf} className={primaryButton}>Exportar PDF</button>
        </div>
      </header>
      {summary.error && <p role="alert" className="text-danger">{summary.error}</p>}
      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ingresos" value={formatMoney(s.income)} icon={TrendingUp} tone="brand" />
            <StatCard label="Gastos" value={formatMoney(s.expense)} icon={TrendingDown} tone="danger" />
            <StatCard label="Ahorro" value={formatMoney(s.saving)} icon={PiggyBank} tone="brand" />
            <StatCard label="Resultado del período" value={formatMoney(net)} icon={Scale} tone={Number(net) < 0 ? 'danger' : 'accent'} />
          </div>
          <Card>
            <h2 className="mb-3 font-medium">Gastos por categoría</h2>
            {s.expenseByCategory.length === 0 ? <EmptyState title="Sin gastos en este período" hint="Cambia el período o registra un gasto." /> : (
              <ul className="divide-y divide-line">
                {s.expenseByCategory.map((c) => (
                  <li key={c.categoryId ?? 'none'} className="flex justify-between py-2 text-sm">
                    <span>{c.name}</span>
                    <span className="tabular-nums text-muted">{formatMoney(c.amount)} · {totalExpense ? ((cents(c.amount) / totalExpense) * 100).toFixed(1) : '0'}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 font-medium">Movimientos del período{txs ? ` (${txs.items.length} de ${txs.total})` : ''}</h2>
            {txs?.items.length === 0 ? <EmptyState title="Sin movimientos en este período" hint="Cambia el período para ver otros." /> : (
              <ul className="divide-y divide-line">{txs?.items.map((t) => <TransactionItem key={t.id} t={t} />)}</ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
