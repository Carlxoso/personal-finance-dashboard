import { useState, type FormEvent } from 'react';
import { Field } from '../components/Field';
import { api } from '../lib/api';
import type { User } from '../types';

const input = 'mt-2 w-full rounded-xl border border-line bg-bg px-4 py-3 text-base text-fg placeholder:text-muted';

export default function Login({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try { onDone(await api<User>(`/auth/${mode}`, { method: 'POST', body: { email: f.get('email'), password: f.get('password') } })); }
    catch (err) { setError((err as Error).message); }
  }
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-2xl shadow-black/30 sm:p-10">
        <img src="/logo.png" alt="" className="mx-auto h-24 w-24" />
        <h1 className="mt-4 text-center text-3xl font-semibold">Finanzas</h1>
        <p className="mt-2 text-center text-muted">{mode === 'login' ? 'Inicia sesión para ver tu dinero' : 'Crea tu cuenta para empezar'}</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label="Correo"><input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" className={input} /></Field>
          <Field label="Contraseña (mínimo 10 caracteres)"><input name="password" type="password" required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={input} /></Field>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button className="w-full rounded-xl bg-brand py-3 text-base font-semibold text-bg transition hover:brightness-110">{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
        </form>
        <button type="button" className="mt-5 w-full text-sm text-muted hover:text-fg" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Crear una cuenta' : 'Ya tengo cuenta'}
        </button>
      </section>
    </main>
  );
}
