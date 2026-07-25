import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import './locales/i18n';
import App from './App';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/copy-tex.js';

import { HelmetProvider } from 'react-helmet-async';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <HelmetProvider>
    <ApiErrorBoundaryProvider>
      <App />
    </ApiErrorBoundaryProvider>
  </HelmetProvider>,
);
