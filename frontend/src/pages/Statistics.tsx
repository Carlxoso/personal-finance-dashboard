import { PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MonthlyCharts, toChartPoints } from '../components/MonthlyCharts';
import { Card, EmptyState, StatCard } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import { formatMoney } from '../lib/format';
import type { MonthPoint } from '../types';

const money = (n: number) => formatMoney(n.toFixed(2)); // solo presentación

export default function Statistics() {
  const [months, setMonths] = useState(6);
  const { data, error } = useLoad<MonthPoint[]>(`/statistics/monthly?months=${months}`);

  const points = useMemo(() => toChartPoints(data), [data]);

  const stats = useMemo(() => {
    const n = points.length || 1;
    const best = points.reduce((a, p) => (p.saving > (a?.saving ?? 0) ? p : a), undefined as (typeof points)[number] | undefined);
    const [prev, last] = points.slice(-2);
    const change = prev && last && prev.expense > 0 ? ((last.expense - prev.expense) / prev.expense) * 100 : null;
    return { avgIncome: points.reduce((s, p) => s + p.income, 0) / n, avgExpense: points.reduce((s, p) => s + p.expense, 0) / n, best, change };
  }, [points]);

  const empty = points.every((p) => p.income === 0 && p.expense === 0 && p.saving === 0);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <select aria-label="Meses a mostrar" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
          <option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option>
        </select>
      </header>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {data && empty && <Card><EmptyState title="Sin movimientos en este período" hint="Registra ingresos o gastos para ver tus estadísticas." /></Card>}
      {data && !empty && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Ingreso promedio mensual" value={money(stats.avgIncome)} icon={TrendingUp} tone="brand" />
            <StatCard label="Gasto promedio mensual" value={money(stats.avgExpense)} icon={TrendingDown} tone="danger" />
            <StatCard label="Mejor mes de ahorro" value={stats.best ? `${stats.best.label}: ${money(stats.best.saving)}` : 'Sin ahorros aún'} icon={PiggyBank} tone="brand" />
          </div>
          {stats.change !== null && (
            <p className="text-sm text-muted">
              En lo que va del mes, tus gastos son {Math.abs(stats.change).toFixed(0)}% {stats.change > 0 ? 'mayores' : 'menores'} que los del mes anterior.
            </p>
          )}
          <MonthlyCharts points={points} />
        </>
      )}
    </div>
  );
}
