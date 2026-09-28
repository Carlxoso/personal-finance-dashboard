import { useState, type FormEvent } from 'react';
import { Card } from '../components/ui';
import { api } from '../lib/api';
import type { User } from '../types';

export default function Login({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try { onDone(await api<User>(`/auth/${mode}`, { method: 'POST', body: { email: f.get('email'), password: f.get('password') } })); }
    catch (err) { setError((err as Error).message); }
  }
  const input = 'mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2';
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <h1 className="text-xl font-semibold">{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
          <label className="block text-sm">Correo<input name="email" type="email" required autoComplete="email" className={input} /></label>
          <label className="block text-sm">Contraseña (mínimo 10 caracteres)<input name="password" type="password" required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={input} /></label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button className="w-full rounded-lg bg-brand py-2 font-medium text-bg">{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
          <button type="button" className="w-full text-sm text-muted" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Crear una cuenta' : 'Ya tengo cuenta'}
          </button>
        </form>
      </Card>
    </main>
  );
}
