import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState, ProgressBar, StatCard } from '../components/ui';
import { api } from '../lib/api';
import { PERIODS, formatMoney, rangeFor, type PeriodKey } from '../lib/format';
import type { PeriodSummary } from '../types';

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [data, setData] = useState<PeriodSummary | null>(null);
  const [error, setError] = useState('');
  const query = useMemo(() => new URLSearchParams(rangeFor(period)).toString(), [period]);

  useEffect(() => {
    let live = true;
    setData(null); setError('');
    api<PeriodSummary>(`/statistics/summary?${query}`).then((d) => live && setData(d), (e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [query]);

  const maxExpense = Math.max(1, ...(data?.expenseByCategory.map((c) => Number(c.amount)) ?? []));
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <select aria-label="Período" value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </header>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {!data && !error && <p className="text-muted">Cargando…</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Saldo total" value={formatMoney(data.totalBalance)} icon={Wallet} />
            <StatCard label="Ingresos" value={formatMoney(data.income)} icon={TrendingUp} tone="brand" />
            <StatCard label="Gastos" value={formatMoney(data.expense)} icon={TrendingDown} tone="danger" />
            <StatCard label="Ahorro" value={formatMoney(data.saving)} icon={PiggyBank} tone="brand" />
          </div>
          <Card>
            <h2 className="mb-4 font-medium">Gastos por categoría</h2>
            {data.expenseByCategory.length === 0 ? <EmptyState title="Sin gastos en este período" hint="Registra un movimiento para verlo aquí." /> : (
              <ul className="space-y-3">
                {data.expenseByCategory.map((c) => (
                  <li key={c.categoryId ?? 'none'}>
                    <div className="mb-1 flex justify-between text-sm"><span>{c.name}</span><span className="tabular-nums text-muted">{formatMoney(c.amount)}</span></div>
                    <ProgressBar value={(Number(c.amount) / maxExpense) * 100} label={c.name} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
