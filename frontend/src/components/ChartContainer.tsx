import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card } from './ui';

// Los colores salen de los tokens de index.css; no se definen colores propios en los gráficos.
export const axisProps = { tick: { fill: 'var(--color-muted)', fontSize: 12 }, tickLine: false, axisLine: false } as const;
export const tooltipStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 12 } as const;

export const ChartContainer = ({ title, children }: { title: string; children: ReactElement }) => (
  <Card>
    <h2 className="mb-4 font-medium">{title}</h2>
    <div className="h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
  </Card>
);
