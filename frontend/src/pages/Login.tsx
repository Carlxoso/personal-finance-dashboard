import { useState, type FormEvent } from 'react';
import { FadeIn } from '../components/FadeIn';
import { Field } from '../components/Field';
import { LoadingScreen } from '../components/LoadingScreen';
import { VersionTag } from '../components/VersionTag';
import { api } from '../lib/api';
import { wait } from '../lib/wait';
import type { User } from '../types';

const input = 'mt-2 w-full rounded-lg bg-fg px-4 py-3 text-base text-bg placeholder:text-muted';

export default function Login({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = { email: f.get('email'), password: f.get('password'), ...(mode === 'register' && { name: f.get('name') }) };
    setError(''); setBusy(true);
    try { const [user] = await Promise.all([api<User>(`/auth/${mode}`, { method: 'POST', body }), wait(1200)]); onDone(user); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  }

  if (busy) return <LoadingScreen label={mode === 'login' ? 'Entrando a tu cuenta…' : 'Creando tu cuenta…'} />;
  return (
    <FadeIn>
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-bg bg-[url(/login-bg.jpg)] bg-cover bg-center p-4 pb-12">
        <section className="relative w-full max-w-sm rounded-[2rem] border border-white/15 bg-surface/50 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3"><img src="/logo.png" alt="" className="h-10 w-10" /><span className="text-xl font-semibold">Finanzas</span></div>
          <h1 className="mt-8 text-2xl font-semibold">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {mode === 'register' && <Field label="Nombre"><input name="name" required maxLength={60} autoComplete="name" className={input} /></Field>}
            <Field label="Correo"><input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" className={input} /></Field>
            <Field label="Contraseña (mínimo 10 caracteres)"><input name="password" type="password" required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={input} /></Field>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <button className="w-full rounded-lg bg-brand py-3 font-semibold text-bg transition hover:brightness-110">{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button type="button" className="font-semibold text-fg hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </section>
        <VersionTag />
      </main>
    </FadeIn>
  );
}
