import { Lock, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { FadeIn } from './FadeIn';
import { VersionTag } from './VersionTag';

export const authInput = 'w-full rounded-lg border border-line bg-white pl-11 pr-4 text-base text-fg transition placeholder:text-transparent hover:border-gray-300 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10';
export const authButton = 'group flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 font-semibold text-white transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60';

/** Campo con ícono y etiqueta flotante para las pantallas de acceso. */
export function AuthField({ id, label, icon: Icon, children, trailing }: { id: string; label: string; icon: LucideIcon; children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="auth-field">
      <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400" aria-hidden />
      {children}
      <label htmlFor={id}>{label}</label>
      {trailing}
    </div>
  );
}

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

// Datos ilustrativos de la vista previa (no son datos del usuario).
const PREVIEW = [
  { m: 'Jun', i: 62, e: 48 }, { m: 'Jul', i: 70, e: 55 }, { m: 'Ago', i: 58, e: 51 },
  { m: 'Sep', i: 76, e: 49 }, { m: 'Oct', i: 72, e: 57 }, { m: 'Nov', i: 84, e: 52 },
];
const KPIS = [
  { label: 'Ingresos', value: '$ 2.150,00', tone: 'text-teal-300' },
  { label: 'Gastos', value: '$ 1.384,20', tone: 'text-slate-200' },
  { label: 'Ahorro', value: '$ 420,00', tone: 'text-slate-200' },
];

/** Panel de marca: sobrio, con una vista previa estática del producto. */
function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between bg-[#0b1324] p-12 text-white lg:flex xl:p-16" aria-hidden>
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-9 w-9" />
        <span className="text-lg font-semibold tracking-tight">Finanzas</span>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <h2 className="auth-rise text-[2rem] font-semibold leading-tight tracking-tight xl:text-4xl" style={delay(100)}>
          Controla tus finanzas personales con claridad.
        </h2>
        <p className="auth-rise mt-4 max-w-md text-[15px] leading-relaxed text-slate-400" style={delay(200)}>
          Registra ingresos y gastos, sigue tus metas de ahorro y genera reportes de cada período.
        </p>

        {/* Vista previa del dashboard */}
        <div className="auth-rise mt-10 rounded-xl border border-white/[0.08] bg-[#111b30] p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,.6)]" style={delay(320)}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Resumen de noviembre</p>
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-slate-400">Este mes</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 border-b border-white/[0.06] pb-5">
            {KPIS.map((k) => (
              <div key={k.label}>
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className={`mt-1 text-[15px] font-semibold tabular-nums ${k.tone}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex h-32 items-end justify-between gap-3">
            {PREVIEW.map((p, n) => (
              <div key={p.m} className="flex h-full flex-1 flex-col justify-end">
                <div className="flex h-full items-end justify-center gap-1">
                  <div className="auth-bar w-2.5 origin-bottom rounded-sm bg-teal-400" style={{ height: `${p.i}%`, ...delay(500 + n * 60) }} />
                  <div className="auth-bar w-2.5 origin-bottom rounded-sm bg-slate-600" style={{ height: `${p.e}%`, ...delay(530 + n * 60) }} />
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-500">{p.m}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-teal-400" />Ingresos</span>
            <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm bg-slate-600" />Gastos</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>© {new Date().getFullYear()} Moreira Carlos</span>
        <span className="flex items-center gap-1.5"><Lock size={12} />Conexión cifrada</span>
      </div>
    </aside>
  );
}

/** Marco común de las pantallas sin sesión (login y cambio de contraseña). */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <FadeIn>
      <main className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_1fr]">
        <BrandPanel />
        <section className="flex items-center justify-center p-6 pb-14 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <img src="/logo.png" alt="" className="h-9 w-9" /><span className="text-lg font-semibold">Finanzas</span>
            </div>
            <h1 className="auth-rise text-[1.75rem] font-semibold tracking-tight text-fg" style={delay(100)}>{title}</h1>
            <p className="auth-rise mt-2 text-sm text-muted" style={delay(160)}>{subtitle ?? 'Ingresa tus datos para continuar.'}</p>
            <div className="auth-rise" style={delay(220)}>{children}</div>
          </div>
        </section>
        <VersionTag />
      </main>
    </FadeIn>
  );
}
