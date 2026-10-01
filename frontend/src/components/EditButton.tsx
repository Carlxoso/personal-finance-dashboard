import { Pencil } from 'lucide-react';

export const EditButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} aria-label={`Editar ${label}`} className="text-muted hover:text-fg"><Pencil size={16} aria-hidden /></button>
);
