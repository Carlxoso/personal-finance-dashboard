import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthField, AuthLayout, authButton, authInput } from '../components/AuthLayout';
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
    <AuthLayout title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} subtitle={mode === 'login' ? 'Ingresa con tu correo y contraseña.' : 'Completa tus datos para crear la cuenta.'}>
      <form onSubmit={submit} className={`mt-8 space-y-4 ${error ? 'auth-shake' : ''}`} key={error}>
        {mode === 'register' && (
          <AuthField id="name" label="Nombre" icon={UserRound}>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" placeholder="Nombre" className={`${authInput} h-14`} />
          </AuthField>
        )}
        <AuthField id="email" label="Correo electrónico" icon={Mail}>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" placeholder="tu@correo.com" className={`${authInput} h-14`} />
        </AuthField>
        <AuthField id="password" label="Contraseña" icon={Lock} trailing={
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>}>
          <input id="password" name="password" type={show ? 'text' : 'password'} required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Contraseña" className={`${authInput} h-14 pr-12`} />
        </AuthField>
        <p className="-mt-1 text-xs text-muted">Mínimo 10 caracteres.</p>
        {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm text-danger"><AlertCircle size={16} className="shrink-0" aria-hidden />{error}</p>}
        <button className={`${authButton} !mt-6`}>
          {mode === 'login' ? 'Entrar' : 'Registrarme'}
          <ArrowRight size={18} className="transition group-hover:translate-x-0.5" aria-hidden />
        </button>
      </form>
      {open && (
        <p className="mt-8 text-center text-sm text-muted">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button type="button" className="font-semibold text-brand hover:underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      )}
    </AuthLayout>
  );
}
