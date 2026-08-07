import { createRoot } from 'react-dom/client';
import './index.css';
import './animations.css';
import App from './App.jsx';
import Providers from './core/providers.jsx';
import { GlobalErrorBoundary } from './shared/GlobalErrorBoundary.jsx';
import { bootApp } from './core/boot.js';

createRoot(document.getElementById('root')).render(
  <GlobalErrorBoundary>
    <Providers>
      <App/>
    </Providers>
  </GlobalErrorBoundary>
);

bootApp();
