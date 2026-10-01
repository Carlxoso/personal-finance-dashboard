const button = 'rounded-lg border border-line px-3 py-1.5 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40';

export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted">
      <span>Página {page} de {pages} · {total} movimientos</span>
      <div className="flex gap-2">
        <button className={button} disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
        <button className={button} disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente</button>
      </div>
    </div>
  );
}
