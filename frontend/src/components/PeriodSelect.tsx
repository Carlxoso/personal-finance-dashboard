import { PERIODS, type PeriodKey } from '../lib/format';

export const PeriodSelect = ({ value, onChange }: { value: PeriodKey; onChange: (k: PeriodKey) => void }) => (
  <select aria-label="Período" value={value} onChange={(e) => onChange(e.target.value as PeriodKey)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
    {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
  </select>
);
