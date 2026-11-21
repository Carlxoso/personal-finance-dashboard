import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ConfirmProvider } from './components/Confirm';
import { ToastProvider } from './components/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(<StrictMode><ToastProvider><ConfirmProvider><App /></ConfirmProvider></ToastProvider></StrictMode>);

// PWA: solo en producción, para que el service worker no interfiera con la recarga en caliente de Vite.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined); });
}
