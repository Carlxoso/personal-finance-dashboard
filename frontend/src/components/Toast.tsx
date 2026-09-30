import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Kind = 'success' | 'error';
interface ToastItem { id: number; kind: Kind; message: string }
interface Toasts { success: (message: string) => void; error: (message: string) => void }

const Ctx = createContext<Toasts | null>(null);

const css = `@keyframes toast-in{from{opacity:0;transform:translateY(-10px) scale(.96)}to{opacity:1;transform:none}}
@keyframes draw{to{stroke-dashoffset:0}}
.toast{animation:toast-in .25s ease-out}
.draw-circle{stroke-dasharray:63;stroke-dashoffset:63;animation:draw .5s ease-out forwards}
.draw-mark{stroke-dasharray:30;stroke-dashoffset:30;animation:draw .35s .3s ease-out forwards}`;

const MARKS: Record<Kind, string> = { success: 'M7.5 12.5l3 3 6-6.5', error: 'M8.5 8.5l7 7M15.5 8.5l-7 7' };

function ToastIcon({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-8 w-8 shrink-0 ${kind === 'success' ? 'text-brand' : 'text-danger'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle className="draw-circle" cx="12" cy="12" r="10" /><path className="draw-mark" d={MARKS[kind]} />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((kind: Kind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l.slice(-2), { id, kind, message }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  const value = useMemo<Toasts>(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <style>{css}</style>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="toast pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3 shadow-2xl shadow-black/40">
            <ToastIcon kind={t.kind} /><p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
