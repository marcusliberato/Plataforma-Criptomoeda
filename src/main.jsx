import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.web.jsx';
import { applyWebPlatformClass } from './platform/applyWebPlatformClass.js';
import './index.css';
import './styles/index.css';
import './styles/platform.css';

function attachRuntimeLoggers() {
  window.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.error('[runtime] uncaught_error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    // eslint-disable-next-line no-console
    console.error('[runtime] unhandled_rejection', {
      reason: event.reason,
    });
  });

  // eslint-disable-next-line no-console
  console.info('[runtime] app_boot_started', {
    origin: window.location.origin,
    href: window.location.href,
  });
}

attachRuntimeLoggers();
applyWebPlatformClass();

const rootElement = document.getElementById('root');

if (!rootElement) {
  // eslint-disable-next-line no-console
  console.error('[runtime] root_not_found');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // eslint-disable-next-line no-console
  console.info('[runtime] app_boot_completed');
}
