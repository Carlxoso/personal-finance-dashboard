import { Clock, Database, KeyRound, Server, UserCheck, Users } from 'lucide-react';
import { duration } from '../lib/format';
import { APP_VERSION } from '../lib/version';
import type { AdminSummary } from '../types';
import { Card, StatCard } from './ui';

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y!, m! - 1, 1).toLocaleDateString('es-EC', { month: 'short' });
};

/** Resumen del sistema para el administrador: cuentas de acceso y salud del servicio (sin datos financieros). */
export function AdminOverview({ data }: { data: AdminSummary }) {
  const { users, signupsByMonth, system } = data;
  const max = Math.max(1, ...signupsByMonth.map((s) => s.count));
  const row = 'flex items-center justify-between gap-3 py-2.5 text-sm';
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios activos" value={`${users.active} de ${users.total}`} icon={Users} />
        <StatCard label="Entraron esta semana" value={String(users.active7d)} icon={UserCheck} tone="brand" />
        <StatCard label="Clave temporal pendiente" value={String(users.pendingPassword)} icon={KeyRound} tone={users.pendingPassword ? 'accent' : 'brand'} />
        <StatCard label="Sin acceso en 90 días" value={String(users.stale)} icon={Clock} tone={users.stale ? 'danger' : 'brand'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-medium">Nuevos usuarios</h2>
            <span className="text-sm text-muted">{users.newThisMonth} este mes</span>
          </div>
          <div className="flex h-32 items-end gap-3" role="img" aria-label={`Usuarios creados por mes: ${signupsByMonth.map((s) => `${monthLabel(s.month)} ${s.count}`).join(', ')}`}>
            {signupsByMonth.map((s) => (
              <div key={s.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-xs tabular-nums text-muted">{s.count || ''}</span>
                <div className="w-full max-w-10 rounded-t-md bg-brand/80" style={{ height: `${(s.count / max) * 100}%`, minHeight: s.count ? 4 : 0 }} />
                <span className="text-xs capitalize text-muted">{monthLabel(s.month)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 font-medium">Estado del sistema</h2>
          <div className="divide-y divide-line">
            <div className={row}>
              <span className="flex items-center gap-2 text-muted"><Database size={16} aria-hidden />Base de datos</span>
              <span className={`flex items-center gap-2 font-medium ${system.dbOk ? 'text-brand' : 'text-danger'}`}>
                <span className={`h-2 w-2 rounded-full ${system.dbOk ? 'bg-brand' : 'bg-danger'}`} />
                {system.dbOk ? `En línea · ${system.latencyMs} ms` : 'Sin conexión'}
              </span>
            </div>
            <div className={row}>
              <span className="flex items-center gap-2 text-muted"><Server size={16} aria-hidden />API activa desde hace</span>
              <span className="font-medium tabular-nums">{duration(system.uptimeSeconds)}</span>
            </div>
            <div className={row}><span className="text-muted">Administradores activos</span><span className="font-medium tabular-nums">{users.admins}</span></div>
            <div className={row}><span className="text-muted">Nunca han entrado</span><span className="font-medium tabular-nums">{users.neverLoggedIn}</span></div>
            <div className={row}><span className="text-muted">Versión de la app</span><span className="font-medium tabular-nums">v{APP_VERSION}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
