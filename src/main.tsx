import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register service worker with automatic update check
registerSW({
  onRegistered(r) {
    // Check for updates every hour
    r && setInterval(() => {
      r.update();
    }, 60 * 60 * 1000);
  },
  onNeedRefresh() {
    // Automatically reload the page when a new version is available
    window.location.reload();
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
