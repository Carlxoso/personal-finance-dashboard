import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Botón con panel desplegable; se cierra al hacer clic fuera o con Escape. */
export function Dropdown({ label, button, children }: { label: string; button: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-xl p-1.5 text-muted transition hover:bg-line/40 hover:text-fg">{button}</button>
      {open && <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/40">{children(() => setOpen(false))}</div>}
    </div>
  );
}
