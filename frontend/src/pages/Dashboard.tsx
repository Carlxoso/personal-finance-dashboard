import { PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MonthlyCharts, toChartPoints } from '../components/MonthlyCharts';
import { PeriodSelect } from '../components/PeriodSelect';
import { TransactionItem } from '../components/TransactionItem';
import { Card, EmptyState, ProgressBar, StatCard } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { DEFAULT_PERIOD, formatMoney, rangeFor, type PeriodKey, type PeriodState } from '../lib/format';
import type { Goal, MonthPoint, Page, PeriodSummary, Transaction } from '../types';

// Meses que abarcan los gráficos según el período elegido.
const CHART_MONTHS: Record<Exclude<PeriodKey, 'custom'>, number> = { today: 6, week: 6, month: 6, quarter: 3, year: 12 };

// En un período personalizado, los gráficos cubren desde el mes de inicio hasta hoy (máx. 24 meses).
function chartMonths(p: PeriodState) {
  if (p.key !== 'custom') return CHART_MONTHS[p.key];
  if (!p.from) return 6;
  const start = new Date(`${p.from}T00:00:00`), now = new Date();
  return Math.min(24, Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1));
}

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodState>(DEFAULT_PERIOD);
  const query = useMemo(() => new URLSearchParams(rangeFor(period)).toString(), [period]);
  const summary = useLoad<PeriodSummary>(`/statistics/summary?${query}`);
  const series = useLoad<MonthPoint[]>(`/statistics/monthly?months=${chartMonths(period)}`);
  const goals = useLoad<Goal[]>('/goals').data;
  const recent = useLoad<Page<Transaction>>('/transactions?pageSize=5').data;

  const points = useMemo(() => toChartPoints(series.data), [series.data]);
  const goal = goals?.filter((g) => Number(g.remaining) > 0).sort((a, b) => Number(b.percent) - Number(a.percent))[0];
  const data = summary.data;
  const maxExpense = Math.max(1, ...(data?.expenseByCategory.map((c) => Number(c.amount)) ?? []));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <PeriodSelect value={period} onChange={setPeriod} />
      </header>
      {summary.error && <p role="alert" className="text-danger">{summary.error}</p>}
      {!data && !summary.error && <p className="text-muted">Cargando…</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Saldo total" value={formatMoney(data.totalBalance)} icon={Wallet} />
            <StatCard label="Ingresos" value={formatMoney(data.income)} icon={TrendingUp} tone="brand" />
            <StatCard label="Gastos" value={formatMoney(data.expense)} icon={TrendingDown} tone="danger" />
            <StatCard label="Ahorro" value={formatMoney(data.saving)} icon={PiggyBank} tone="brand" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2"><MonthlyCharts points={points} /></div>
          <div className="grid gap-4 lg:grid-cols-2">
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
            <Card>
              <h2 className="mb-4 font-medium">Meta activa</h2>
              {!goal ? <EmptyState title="Sin metas activas" hint="Crea una en la sección Metas." /> : (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between"><p className="font-medium">{goal.name}</p><span className="tabular-nums text-brand">{goal.percent}%</span></div>
                  <ProgressBar value={Number(goal.percent)} label={goal.name} />
                  <p className="text-sm tabular-nums text-muted">{formatMoney(goal.current)} / {formatMoney(goal.target)} · Faltan {formatMoney(goal.remaining)}</p>
                </div>
              )}
            </Card>
          </div>
          <Card>
            <h2 className="mb-2 font-medium">Actividad reciente</h2>
            {recent?.items.length === 0 ? <EmptyState title="Sin movimientos todavía" hint="Registra el primero desde Ingresos o Gastos." /> : (
              <ul className="divide-y divide-line">{recent?.items.map((t) => <TransactionItem key={t.id} t={t} />)}</ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
