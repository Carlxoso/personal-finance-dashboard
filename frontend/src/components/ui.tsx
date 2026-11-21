import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const tones = { brand: 'text-brand', accent: 'text-accent', danger: 'text-danger' } as const;
const bgTones = { brand: 'bg-brand/10', accent: 'bg-accent/10', danger: 'bg-danger/10' } as const;

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-card border border-line bg-surface p-4 shadow-sm sm:p-5 shadow-black/[0.03] ${className}`}>{children}</section>
);

export interface Delta { value: number | null; label: string; goodWhenUp: boolean }

/** Variación respecto al período anterior: verde si es buena noticia, rojo si no. */
function DeltaBadge({ value, label, goodWhenUp }: Delta) {
  if (value === null) return <p className="mt-2 text-xs text-muted">Sin datos para comparar</p>;
  const up = value >= 0;
  const good = Math.abs(value) < 0.05 ? null : up === goodWhenUp;
  const tone = good === null ? 'bg-gray-100 text-muted' : good ? 'bg-brand/10 text-brand' : 'bg-danger/10 text-danger';
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="mt-2 flex items-center gap-2 text-xs text-muted">
      <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums ${tone}`}>
        <Arrow size={12} aria-hidden />{Math.abs(value).toLocaleString('es-EC', { maximumFractionDigits: 1 })}%
      </span>
      {label}
    </p>
  );
}

export const StatCard = ({ label, value, icon: Icon, tone = 'accent', delta }: { label: string; value: string; icon: LucideIcon; tone?: keyof typeof tones; delta?: Delta }) => (
  <Card>
    <div className="flex items-center justify-between text-sm text-muted"><span>{label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${bgTones[tone]}`}><Icon size={18} className={tones[tone]} aria-hidden /></span></div>
    <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
    {delta && <DeltaBadge {...delta} />}
  </Card>
);

export const ProgressBar = ({ value, label }: { value: number; label: string }) => (
  <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded-full bg-line">
    <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

export const EmptyState = ({ title, hint }: { title: string; hint: string }) => (
  <div className="py-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted">{hint}</p></div>
);
