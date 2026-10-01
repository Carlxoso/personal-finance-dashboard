import { useState, type FormEvent } from 'react';
import { AuthLayout, authButton, authInput } from '../components/AuthLayout';
import { Field } from '../components/Field';
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
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Contraseña temporal"><input name="current" type="password" required autoComplete="current-password" className={authInput} /></Field>
        <Field label="Nueva contraseña (mínimo 10 caracteres)"><input name="next" type="password" required minLength={10} autoComplete="new-password" className={authInput} /></Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className={authButton}>Guardar y continuar</button>
      </form>
      <button type="button" onClick={onLogout} className="mt-5 w-full text-center text-sm text-muted hover:text-fg">Cerrar sesión</button>
    </AuthLayout>
  );
}
