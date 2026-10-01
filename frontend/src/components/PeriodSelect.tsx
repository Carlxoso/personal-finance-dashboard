import { PERIODS, type PeriodKey, type PeriodState } from '../lib/format';

const field = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm';

export function PeriodSelect({ value, onChange }: { value: PeriodState; onChange: (p: PeriodState) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Período" value={value.key} onChange={(e) => onChange({ ...value, key: e.target.value as PeriodKey })} className={field}>
        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>
      {value.key === 'custom' && (
        <>
          <input type="date" aria-label="Desde" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} className={field} />
          <input type="date" aria-label="Hasta" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} className={field} />
        </>
      )}
    </div>
  );
}
