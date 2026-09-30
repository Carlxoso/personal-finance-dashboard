import { FadeIn } from './FadeIn';

export const LoadingScreen = ({ label = 'Cargando tus finanzas…' }: { label?: string }) => (
  <FadeIn>
    <main className="grid min-h-screen place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-8">
        <img src="/logo.png" alt="" className="h-28 w-28" />
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-line border-t-brand" />
        <p className="text-muted">{label}</p>
      </div>
    </main>
  </FadeIn>
);
