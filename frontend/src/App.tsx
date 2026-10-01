import { useEffect, useState } from 'react';
import { FadeIn } from './components/FadeIn';
import { Header } from './components/Header';
import { LoadingScreen } from './components/LoadingScreen';
import { Sidebar, type SectionId } from './components/Sidebar';
import { VersionTag } from './components/VersionTag';
import { api } from './lib/api';
import { wait } from './lib/wait';
import Accounts from './pages/Accounts';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [section, setSection] = useState<SectionId>('dashboard');
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => { api<User>('/auth/me').then(setUser, () => setUser(null)); }, []);

  async function logout() {
    setLoggingOut(true);
    await Promise.all([api('/auth/logout', { method: 'POST' }).catch(() => undefined), wait(1000)]);
    setUser(null); setSection('dashboard'); setLoggingOut(false);
  }

  if (user === undefined || loggingOut) return <LoadingScreen label={loggingOut ? 'Cerrando sesión…' : undefined} />;
  if (!user) return <Login onDone={setUser} />;
  if (user.mustChangePassword) return <ChangePassword onDone={setUser} onLogout={logout} />;
  return (
    <FadeIn>
      <Sidebar active={section} role={user.role} onSelect={setSection} onLogout={logout} />
      <main className="p-4 pt-16 md:ml-64 md:p-8 md:pt-4">
        <Header user={user} section={section} onNavigate={setSection} />
        {section === 'dashboard' && <Dashboard />}
        {section === 'accounts' && <Accounts />}
        {section === 'income' && <Transactions key="income" type="INCOME" title="Ingresos" />}
        {section === 'expenses' && <Transactions key="expenses" type="EXPENSE" title="Gastos" />}
        {section === 'savings' && <Transactions key="savings" type="SAVING" title="Ahorros" />}
        {section === 'goals' && <Goals />}
        {section === 'stats' && <Statistics />}
        {section === 'reports' && <Reports user={user} />}
        {section === 'users' && user.role === 'ADMIN' && <Users meId={user.id} />}
        {section === 'settings' && <Settings />}
        {section === 'profile' && <Profile user={user} onUpdated={setUser} />}
        {section === 'history' && <Transactions key="history" title="Historial" />}
      </main>
      <VersionTag />
    </FadeIn>
  );
}
