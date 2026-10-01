import type { ReactNode } from 'react';

export const inputClass = 'mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg';
export const secondaryButton = 'rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-muted hover:bg-line/40 hover:text-fg';
export const dangerButton = 'rounded-lg bg-danger px-4 py-2 text-sm font-medium text-bg transition hover:brightness-110';
export const primaryButton = 'rounded-lg bg-brand px-4 py-2 text-sm font-medium text-bg';
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block text-sm text-muted">{label}{children}</label>
);
