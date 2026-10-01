import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { dangerButton, primaryButton, secondaryButton } from './Field';
import { Modal } from './Modal';

interface Options { title?: string; message: string; confirmLabel?: string; danger?: boolean }
const Ctx = createContext<((options: Options) => Promise<boolean>) | null>(null);

/** Reemplaza window.confirm: `if (!(await confirm({ message }))) return;` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: Options; resolve: (ok: boolean) => void } | null>(null);
  const confirm = useCallback((options: Options) => new Promise<boolean>((resolve) => setState({ options, resolve })), []);
  const answer = (ok: boolean) => { state?.resolve(ok); setState(null); };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {state && (
        <Modal title={state.options.title ?? 'Confirmar'} onClose={() => answer(false)} width="max-w-md">
          <p className="text-sm text-muted">{state.options.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button className={secondaryButton} onClick={() => answer(false)}>Cancelar</button>
            <button data-autofocus className={state.options.danger === false ? primaryButton : dangerButton} onClick={() => answer(true)}>{state.options.confirmLabel ?? 'Confirmar'}</button>
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
}
