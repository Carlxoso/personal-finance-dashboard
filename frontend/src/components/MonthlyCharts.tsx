import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney } from '../lib/format';
import type { MonthPoint } from '../types';
import { ChartContainer, axisProps, tooltipStyle } from './ChartContainer';

export interface ChartPoint { label: string; income: number; expense: number; saving: number; balance: number }

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y!, m! - 1, 1).toLocaleDateString('es-EC', { month: 'short' });
};
const fmt = (v: unknown) => formatMoney(Number(v).toFixed(2)); // solo presentación

export const toChartPoints = (data: MonthPoint[] | null): ChartPoint[] =>
  data?.map((p) => ({ label: monthLabel(p.month), income: Number(p.income), expense: Number(p.expense), saving: Number(p.saving), balance: Number(p.balance) })) ?? [];

/** Evolución del saldo e ingresos vs gastos; se usa en Dashboard y Estadísticas. */
export function MonthlyCharts({ points }: { points: ChartPoint[] }) {
  return (
    <>
      <ChartContainer title="Evolución del saldo">
        <LineChart data={points}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} /><YAxis width={64} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
          <Line type="monotone" dataKey="balance" name="Saldo" stroke="var(--color-brand)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
      <ChartContainer title="Ingresos vs gastos">
        <BarChart data={points}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} /><YAxis width={64} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} formatter={fmt} cursor={{ fill: 'var(--color-line)', opacity: 0.4 }} />
          <Legend />
          <Bar dataKey="income" name="Ingresos" fill="var(--color-brand)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Gastos" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </>
  );
}
