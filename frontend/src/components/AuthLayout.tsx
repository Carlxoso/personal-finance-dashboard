import type { ReactNode } from 'react';
import { FadeIn } from './FadeIn';
import { VersionTag } from './VersionTag';

export const authInput = 'mt-2 w-full rounded-lg bg-fg px-4 py-3 text-base text-bg placeholder:text-muted';
export const authButton = 'w-full rounded-lg bg-brand py-3 font-semibold text-bg transition hover:brightness-110';

/** Marco común de las pantallas sin sesión (login y cambio de contraseña). */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <FadeIn>
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg bg-[url(/login-bg.jpg)] bg-cover bg-center p-4 pb-12">
        <section className="relative w-full max-w-sm rounded-[2rem] border border-white/15 bg-surface/50 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3"><img src="/logo.png" alt="" className="h-10 w-10" /><span className="text-xl font-semibold">Finanzas</span></div>
          <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          {children}
        </section>
        <VersionTag />
      </main>
    </FadeIn>
  );
}
