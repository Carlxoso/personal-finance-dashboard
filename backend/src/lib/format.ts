const fmt = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
export const formatMoney = (v: string) => fmt.format(Number(v)); // solo presentación

export type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
/** from/to (AAAA-MM-DD) solo se usan con el período personalizado. */
export interface PeriodState { key: PeriodKey; from: string; to: string }
export const DEFAULT_PERIOD: PeriodState = { key: 'month', from: '', to: '' };

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hoy' }, { key: 'week', label: 'Esta semana' }, { key: 'month', label: 'Este mes' },
  { key: 'quarter', label: 'Últimos 3 meses' }, { key: 'year', label: 'Este año' }, { key: 'custom', label: 'Personalizado' },
];

export const periodLabel = (p: PeriodState) =>
  p.key === 'custom' ? `${p.from || 'inicio de mes'} a ${p.to || 'hoy'}` : PERIODS.find((x) => x.key === p.key)?.label ?? '';

export function rangeFor(p: PeriodState) {
  const now = new Date();
  if (p.key === 'custom') {
    const start = p.from ? new Date(`${p.from}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = p.to ? new Date(`${p.to}T23:59:59`) : now;
    return { from: start.toISOString(), to: end.toISOString() };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p.key === 'week') from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
  if (p.key === 'month') from.setDate(1);
  if (p.key === 'quarter') from.setMonth(from.getMonth() - 3);
  if (p.key === 'year') from.setMonth(0, 1);
  return { from: from.toISOString(), to: now.toISOString() };
}
