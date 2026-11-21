const fmt = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
});

export const formatMoney = (v: string | number) => {
  return fmt.format(Number(v));
};

export type PeriodKey =
  | 'today'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'custom';

export type PeriodState = {
  key: PeriodKey;
  from?: string;
  to?: string;
};

export const DEFAULT_PERIOD: PeriodState = {
  key: 'month',
};

export const PERIODS: {
  key: Exclude<PeriodKey, 'custom'>;
  label: string;
}[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'quarter', label: 'Últimos 3 meses' },
  { key: 'year', label: 'Este año' },
];

export function periodLabel(period: PeriodState): string {
  if (period.key === 'custom') {
    if (period.from && period.to) return `Del ${period.from} al ${period.to}`;
    if (period.from) return `Desde ${period.from}`;
    return 'Personalizado';
  }

  const found = PERIODS.find((p) => p.key === period.key);
  return found?.label ?? period.key;
}

export function rangeFor(period: PeriodState) {
  const now = new Date();

  if (period.key === 'custom') {
    if (!period.from) {
      return {
        from: now.toISOString(),
        to: now.toISOString(),
      };
    }

    const from = new Date(`${period.from}T00:00:00`);

    const to = period.to
      ? new Date(`${period.to}T23:59:59`)
      : now;

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }

  const from = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (period.key === 'week') {
    from.setDate(
      from.getDate() - ((from.getDay() + 6) % 7)
    );
  }

  if (period.key === 'month') {
    from.setDate(1);
  }

  if (period.key === 'quarter') {
    from.setMonth(from.getMonth() - 3);
  }

  if (period.key === 'year') {
    from.setMonth(0, 1);
  }

  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
}
// Suma meses sin desbordar (31 de marzo − 1 mes = 28/29 de febrero, no 3 de marzo).
function shiftMonths(d: Date, n: number) {
  const r = new Date(d);
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + n);
  r.setDate(Math.min(day, new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
  return r;
}

const COMPARE_LABEL: Record<PeriodKey, string> = {
  today: 'vs ayer', week: 'vs semana anterior', month: 'vs mes anterior',
  quarter: 'vs 3 meses anteriores', year: 'vs año anterior', custom: 'vs período anterior',
};

/** Período equivalente anterior, para comparar (ej.: 1–20 nov vs 1–20 oct). */
export function previousRange(period: PeriodState) {
  const { from, to } = rangeFor(period);
  const f = new Date(from), t = new Date(to);
  const days = (n: number) => ({ from: new Date(f.getTime() - n * 864e5).toISOString(), to: new Date(t.getTime() - n * 864e5).toISOString() });
  const months = (n: number) => ({ from: shiftMonths(f, -n).toISOString(), to: shiftMonths(t, -n).toISOString() });
  const range =
    period.key === 'today' ? days(1)
    : period.key === 'week' ? days(7)
    : period.key === 'month' ? months(1)
    : period.key === 'quarter' ? months(3)
    : period.key === 'year' ? months(12)
    : { from: new Date(f.getTime() - (t.getTime() - f.getTime()) - 1).toISOString(), to: new Date(f.getTime() - 1).toISOString() };
  return { ...range, label: COMPARE_LABEL[period.key] };
}

/** Variación porcentual; null si no hay base para comparar. */
export function percentChange(current: string | number, previous: string | number) {
  const c = Number(current), p = Number(previous);
  if (p === 0) return null;
  return ((c - p) / Math.abs(p)) * 100;
}
