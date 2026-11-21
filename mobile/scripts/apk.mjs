// Compila el APK de depuración sin configurar nada a mano:
// usa el Java que trae Android Studio y ubica el Android SDK si hace falta.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const android = join(root, 'android');
const win = platform() === 'win32';
const env = { ...process.env };
const first = (paths) => paths.filter(Boolean).find((p) => existsSync(p));

if (!existsSync(android)) {
  console.error('\n✘ No existe la carpeta android/. Corre primero: npm run setup\n');
  process.exit(1);
}

// 0. Capacitor 8 funciona con Android Gradle Plugin 8.x. Si Android Studio lo "actualizó" a 9, la compilación falla.
const rootGradle = join(android, 'build.gradle');
const agp = existsSync(rootGradle) && readFileSync(rootGradle, 'utf8').match(/com\.android\.tools\.build:gradle:(\d+)\.[\d.]+/);
if (agp && Number(agp[1]) >= 9) {
  console.error(`\n✘ El proyecto Android usa Android Gradle Plugin ${agp[0].split(':').pop()}, y Capacitor 8 requiere la versión 8.x.`);
  console.error('  Suele pasar al aceptar el aviso "Upgrade Android Gradle Plugin" de Android Studio. Para arreglarlo:');
  console.error('    1. Cierra Android Studio');
  console.error('    2. Borra la carpeta mobile/android');
  console.error('    3. npm run setup   y luego   npm run apk');
  console.error('  Y cuando Android Studio vuelva a ofrecer la actualización, elige "Don\'t ask for this project".\n');
  process.exit(1);
}

// 1. Java: el de JAVA_HOME si existe; si no, el JBR incluido en Android Studio.
const javaBin = (home) => join(home, 'bin', win ? 'java.exe' : 'java');
if (!env.JAVA_HOME || !existsSync(javaBin(env.JAVA_HOME))) {
  const jbr = first([
    win && 'C:\\Program Files\\Android\\Android Studio\\jbr',
    win && env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Programs', 'Android Studio', 'jbr'),
    !win && '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    !win && '/opt/android-studio/jbr',
    !win && join(homedir(), 'android-studio', 'jbr'),
  ]);
  if (!jbr) {
    console.error('\n✘ No encontré Java. Instala Android Studio, o define JAVA_HOME apuntando a su carpeta "jbr".\n');
    process.exit(1);
  }
  env.JAVA_HOME = jbr;
  console.log(`• Usando el Java de Android Studio: ${jbr}`);
}

// 2. Android SDK: Gradle lo lee de android/local.properties.
const localProps = join(android, 'local.properties');
if (!existsSync(localProps) && !env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
  const sdk = first([
    win && env.LOCALAPPDATA && join(env.LOCALAPPDATA, 'Android', 'Sdk'),
    !win && join(homedir(), 'Library', 'Android', 'sdk'),
    !win && join(homedir(), 'Android', 'Sdk'),
  ]);
  if (!sdk) {
    console.error('\n✘ No encontré el Android SDK. Ábrelo una vez con "npm run open" para que Android Studio lo instale.\n');
    process.exit(1);
  }
  // En local.properties las barras invertidas y los dos puntos se escapan.
  writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}\n`);
  console.log(`• Android SDK: ${sdk}`);
}

// 3. Compilar.
// En Windows los .bat necesitan shell; se pasa el comando completo (fijo, sin datos externos) para evitar el aviso DEP0190.
const gradle = win
  ? spawnSync('gradlew.bat assembleDebug', { cwd: android, env, stdio: 'inherit', shell: true })
  : spawnSync('./gradlew', ['assembleDebug'], { cwd: android, env, stdio: 'inherit' });
if (gradle.status !== 0) process.exit(gradle.status ?? 1);
console.log(`\n✔ APK listo: ${join(android, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')}\n`);
