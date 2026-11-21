import { AlertCircle, KeyRound, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AuthField, AuthLayout, authButton, authInput } from '../components/AuthLayout';
import { api } from '../lib/api';
import type { User } from '../types';

/** Pantalla obligatoria cuando el administrador asignó una contraseña temporal. */
export default function ChangePassword({ onDone, onLogout }: { onDone: (u: User) => void; onLogout: () => void }) {
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api('/auth/password', { method: 'POST', body: { current: f.get('current'), next: f.get('next') } });
      onDone(await api<User>('/auth/me'));
    } catch (err) { setError((err as Error).message); }
  }
  return (
    <AuthLayout title="Crea tu contraseña" subtitle="Tu administrador te dio una contraseña temporal. Elige una nueva que solo tú conozcas para continuar.">
      <form onSubmit={submit} className={`mt-8 space-y-4 ${error ? 'auth-shake' : ''}`} key={error}>
        <AuthField id="current" label="Contraseña temporal" icon={KeyRound}><input id="current" name="current" type="password" required autoComplete="current-password" placeholder="Contraseña temporal" className={`${authInput} h-14`} /></AuthField>
        <AuthField id="next" label="Nueva contraseña" icon={Lock}><input id="next" name="next" type="password" required minLength={10} autoComplete="new-password" placeholder="Nueva contraseña" className={`${authInput} h-14`} /></AuthField>
        <p className="-mt-1 text-xs text-muted">Mínimo 10 caracteres.</p>
        {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm text-danger"><AlertCircle size={16} className="shrink-0" aria-hidden />{error}</p>}
        <button className={`${authButton} !mt-6`}>Guardar y continuar</button>
      </form>
      <button type="button" onClick={onLogout} className="mt-5 w-full text-center text-sm text-muted hover:text-fg">Cerrar sesión</button>
    </AuthLayout>
  );
}
