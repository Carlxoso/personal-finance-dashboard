import { ROLE_LABEL } from '../components/Header';
import { Card } from '../components/ui';
import { useLoad } from '../hooks/useLoad';
import type { AdminUser } from '../types';

export default function Users() {
  const { data, error } = useLoad<AdminUser[]>('/admin/users');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuarios</h1>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <Card>
        <ul className="divide-y divide-line">
          {data?.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0"><p className="truncate font-medium">{u.name || u.email}</p><p className="truncate text-sm text-muted">{u.email} · desde {new Date(u.createdAt).toLocaleDateString('es-EC')}</p></div>
              <span className="rounded-full bg-brand/15 px-3 py-1 text-xs text-brand">{ROLE_LABEL[u.role]}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
