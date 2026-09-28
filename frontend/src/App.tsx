import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { api } from './lib/api';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => { api<User>('/auth/me').then(setUser, () => setUser(null)); }, []);

  if (user === undefined) return null;
  if (!user) return <Login onDone={setUser} />;
  return (
    <>
      <Sidebar active="dashboard" onLogout={() => api('/auth/logout', { method: 'POST' }).finally(() => setUser(null))} />
      <main className="p-4 pt-16 md:ml-60 md:p-8"><Dashboard /></main>
    </>
  );
}
