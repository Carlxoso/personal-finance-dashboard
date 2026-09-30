import { FadeIn } from './FadeIn';

export const LoadingScreen = ({ label = 'Cargando tus finanzas…' }: { label?: string }) => (
  <FadeIn>
    <main className="grid min-h-screen place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-6">
        <div className="relative grid h-32 w-32 place-items-center">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-line border-t-brand" />
          <img src="/logo.png" alt="" className="h-24 w-24 animate-pulse object-contain" />
        </div>
        <p className="text-muted">{label}</p>
      </div>
    </main>
  </FadeIn>
);
