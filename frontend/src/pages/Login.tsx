import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthLayout, authButton, authInput } from '../components/AuthLayout';
import { Field } from '../components/Field';
import { LoadingScreen } from '../components/LoadingScreen';
import { useLoad } from '../hooks/useLoad';
import { api } from '../lib/api';
import { wait } from '../lib/wait';
import type { User } from '../types';

export default function Login({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');   // se conservan al fallar el ingreso
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const open = useLoad<{ registrationOpen: boolean }>('/auth/status').data?.registrationOpen ?? false;
  useEffect(() => { if (open) setMode('register'); }, [open]);   // sin usuarios: se crea la cuenta del administrador

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get('password');
    const body = { email, password, ...(mode === 'register' && { name }) };
    setError(''); setBusy(true);
    try { const [user] = await Promise.all([api<User>(`/auth/${mode}`, { method: 'POST', body }), wait(1200)]); onDone(user); }
    catch (err) { setError((err as Error).message); setBusy(false); }
  }

  if (busy) return <LoadingScreen label={mode === 'login' ? 'Entrando a tu cuenta…' : 'Creando tu cuenta…'} />;
  return (
    <AuthLayout title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === 'register' && <Field label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" className={authInput} /></Field>}
        <Field label="Correo"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="tu@correo.com" className={authInput} /></Field>
        <Field label="Contraseña (mínimo 10 caracteres)">
          <div className="relative">
            <input name="password" type={show ? 'text' : 'password'} required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={`${authInput} pr-12`} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-slate-500 hover:text-slate-800">
              {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
            </button>
          </div>
        </Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className={authButton}>{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      </form>
      {open && (
        <p className="mt-6 text-center text-sm text-muted">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button type="button" className="font-semibold text-fg hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
