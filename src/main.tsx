
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// GitHub Pages / Vite base path
const baseUrl = import.meta.env.BASE_URL;

// Register PWA Service Worker in production
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`${baseUrl}sw.js`)
        .then((registration) => {
          console.log(
            '[PWA] Service Worker registered:',
            registration.scope
          );
        })
        .catch((error) => {
          console.error(
            '[PWA] Service Worker registration failed:',
            error
          );
        });
    });
  } else {
    // Clean up Service Workers during development
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
  }
}

// Mount React application
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'React root element #root was not found.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
