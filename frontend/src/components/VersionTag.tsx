import { APP_VERSION } from '../lib/version';

export const VersionTag = () => (
  <span className="pointer-events-none fixed bottom-3 right-4 hidden text-xs text-muted/70 md:block">v{APP_VERSION}</span>
);
