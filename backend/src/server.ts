import { app } from './app.js';
import { env } from './config/env.js';
import { purgeOlderThan } from './services/audit.service.js';

app.listen(env.PORT, () => console.log(`API en http://localhost:${env.PORT}`));

// Retención de la bitácora: se conservan 365 días. Se limpia al arrancar y luego una vez al día.
// async + try/catch: cualquier fallo (incluso uno síncrono) queda en el log y NUNCA detiene la API.
const purge = async () => {
  try { await purgeOlderThan(365); } catch (err) { console.error('[bitácora] limpieza fallida', err); }
};
void purge();
setInterval(purge, 24 * 60 * 60 * 1000).unref();
