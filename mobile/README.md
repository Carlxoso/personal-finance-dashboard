# Finanzas para Android

App nativa de Android hecha con [Capacitor 8](https://capacitorjs.com). Abre la versión web publicada
(Vercel) dentro de una app con su propio ícono, splash y pantalla sin conexión.

## Cómo funciona

- La app carga la URL de `server.url` (tu frontend en Vercel). Por eso **no hay que tocar el backend**:
  las cookies de sesión y `/api` funcionan igual que en el navegador.
- Cada vez que publicas en Vercel, la app se actualiza sola. Solo hay que regenerar el APK si cambias
  el ícono, el nombre o la configuración nativa.
- Sin internet se muestra `www/offline.html`, que vuelve sola cuando regresa la conexión.
- El botón "atrás" del teléfono navega entre secciones (lo da `@capacitor/app`) y cierra la app desde el inicio.

## Requisitos

- Node.js 22 o superior
- Android Studio **Otter (2025.2.1) o superior**, con el Android SDK instalado (trae su propio JDK)

## Primera vez

1. Edita `capacitor.config.json` y cambia `server.url` por la dirección de tu frontend publicado:
   ```json
   "server": { "url": "https://tu-app.vercel.app", "errorPath": "offline.html" }
   ```
2. Instala y crea el proyecto Android:
   ```bash
   cd mobile
   npm install
   npm run setup
   ```
   `setup` crea la carpeta `android/`, copia los íconos y el splash, y sincroniza todo.
3. Ábrelo en Android Studio y dale a **Run** con tu teléfono conectado (depuración USB activada) o un emulador:
   ```bash
   npm run open
   ```

## Generar el APK

```bash
npm run apk
```
El archivo queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Se puede instalar en cualquier
Android 7 o superior (el teléfono pedirá permitir "orígenes desconocidos").

Para una versión firmada (la que va a Google Play): en Android Studio, **Build → Generate Signed App Bundle / APK**.
Guarda bien el archivo `.keystore`: sin él no podrás publicar actualizaciones. No lo subas a Git.

## Si cambias algo

| Cambio | Qué hacer |
|---|---|
| Código del frontend | Solo publicar en Vercel. La app lo toma sola. |
| `capacitor.config.json` (URL, nombre…) | `npm run sync` y volver a compilar. |
| Logo / íconos | Reemplazar los archivos de `resources/android/res`, luego `npm run sync`. |

## Ícono y splash

Están en `resources/android/res`, generados a partir de `frontend/public/logo.png`:

- Ícono adaptable (Android 8+) sobre el azul de la marca `#0B1324`, con versión temática para Android 13+
- Íconos clásico y redondo para Android 7
- Splash en vertical y horizontal para todas las densidades
- `resources/play-store-icon.png` (512×512) para la ficha de Google Play

## Nota sobre Google Play

La documentación de Capacitor indica que `server.url` no está pensado para producción, y Google Play puede
rechazar apps que solo muestran un sitio web. Para instalar el APK directamente (clase, presentación,
uso propio) no hay problema. Si más adelante quieres publicarla en Play Store, conviene empaquetar el
frontend dentro de la app o usar una Trusted Web Activity, ya que la app es una PWA.
