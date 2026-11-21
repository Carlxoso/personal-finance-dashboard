// Ayudante del proyecto Android.
//   node scripts/android.mjs check  → verifica que la URL de la app esté configurada
//   node scripts/android.mjs apply  → copia íconos y splash al proyecto Android y prepara la página sin conexión
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'capacitor.config.json'), 'utf8'));
const url = config.server?.url ?? '';

function check() {
  if (!/^https:\/\/[^/]+/.test(url) || url.includes('TU-APP')) {
    console.error('\n✘ Falta la URL de la app. Edita "server.url" en mobile/capacitor.config.json');
    console.error('  y pon la dirección de tu frontend publicado (ej.: https://mi-finanzas.vercel.app).\n');
    process.exit(1);
  }
}

function apply() {
  check();
  // La página sin conexión necesita saber a qué dirección volver.
  writeFileSync(join(root, 'www', 'app-url.js'), `window.APP_URL = ${JSON.stringify(url)};\n`);

  const res = join(root, 'android', 'app', 'src', 'main', 'res');
  if (!existsSync(res)) { console.log('• Aún no existe la carpeta android/ (se crea con "npm run setup").'); return; }

  cpSync(join(root, 'resources', 'android', 'res'), res, { recursive: true });
  console.log('✔ Íconos y splash copiados a android/app/src/main/res');

  // Android 12+ dibuja su propia pantalla de inicio: le damos el fondo azul de la marca.
  const styles = join(res, 'values', 'styles.xml');
  if (existsSync(styles)) {
    let xml = readFileSync(styles, 'utf8');
    if (!xml.includes('windowSplashScreenBackground')) {
      xml = xml.replace(
        /(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/,
        '$1\n        <item name="windowSplashScreenBackground">@color/splash_background</item>',
      );
      writeFileSync(styles, xml);
      console.log('✔ Fondo del splash configurado en styles.xml');
    }
  }
}

const cmd = process.argv[2];
if (cmd === 'check') check();
else if (cmd === 'apply') apply();
else { console.error('Uso: node scripts/android.mjs <check|apply>'); process.exit(1); }
