import { useEffect, useState } from 'react';
import { Sidebar, type SectionId } from './components/Sidebar';
import { api } from './lib/api';
import Accounts from './pages/Accounts';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';
import Transactions from './pages/Transactions';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [section, setSection] = useState<SectionId>('dashboard');
  useEffect(() => { api<User>('/auth/me').then(setUser, () => setUser(null)); }, []);

  if (user === undefined) return null;
  if (!user) return <Login onDone={setUser} />;
  return (
    <>
      <Sidebar active={section} onSelect={setSection} onLogout={() => api('/auth/logout', { method: 'POST' }).finally(() => setUser(null))} />
      <main className="p-4 pt-16 md:ml-60 md:p-8">
        {section === 'dashboard' && <Dashboard />}
        {section === 'accounts' && <Accounts />}
        {section === 'income' && <Transactions key="income" type="INCOME" title="Ingresos" />}
        {section === 'expenses' && <Transactions key="expenses" type="EXPENSE" title="Gastos" />}
        {section === 'savings' && <Transactions key="savings" type="SAVING" title="Ahorros" />}
        {section === 'goals' && <Goals />}
        {section === 'stats' && <Statistics />}
        {section === 'reports' && <Reports />}
        {section === 'settings' && <Settings />}
        {section === 'history' && <Transactions key="history" title="Historial" />}
      </main>
    </>
  );
}
