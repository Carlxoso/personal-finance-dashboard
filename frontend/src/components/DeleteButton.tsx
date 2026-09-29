import { Trash2 } from 'lucide-react';

export const DeleteButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} aria-label={`Eliminar ${label}`} className="text-muted hover:text-danger"><Trash2 size={16} aria-hidden /></button>
);
