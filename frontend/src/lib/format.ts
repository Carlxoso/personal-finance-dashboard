const fmt = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
export const formatMoney = (v: string) => fmt.format(Number(v)); // solo presentación

export type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'year';
export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hoy' }, { key: 'week', label: 'Esta semana' }, { key: 'month', label: 'Este mes' },
  { key: 'quarter', label: 'Últimos 3 meses' }, { key: 'year', label: 'Este año' },
];

export function rangeFor(key: PeriodKey) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'week') from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
  if (key === 'month') from.setDate(1);
  if (key === 'quarter') from.setMonth(from.getMonth() - 3);
  if (key === 'year') from.setMonth(0, 1);
  return { from: from.toISOString(), to: now.toISOString() };
}
