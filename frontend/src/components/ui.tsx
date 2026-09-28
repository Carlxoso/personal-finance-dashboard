import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const tones = { brand: 'text-brand', accent: 'text-accent', danger: 'text-danger' } as const;

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-card border border-line bg-surface p-5 ${className}`}>{children}</section>
);

export const StatCard = ({ label, value, icon: Icon, tone = 'accent' }: { label: string; value: string; icon: LucideIcon; tone?: keyof typeof tones }) => (
  <Card>
    <div className="flex items-center justify-between text-sm text-muted"><span>{label}</span><Icon size={18} className={tones[tone]} aria-hidden /></div>
    <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
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
