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

export function periodLabel(key: PeriodKey): string {
  if (key === 'custom') {
    return 'Personalizado';
  }

  const period = PERIODS.find((p) => p.key === key);
  return period?.label ?? key;
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