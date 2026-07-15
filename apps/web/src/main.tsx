import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { resolveBwsOperatorCockpitBrowserConfig } from './app/data-mode.js';
import { BwsOperatorCockpitBrowserRouter } from './app/router.js';
import './styles/tokens.css';
import './styles/app.css';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('missing #root mount target for @betting-win-surebet/web');
}

const configuration = resolveBwsOperatorCockpitBrowserConfig(
  import.meta.env as Record<string, string | undefined>,
);

createRoot(rootElement).render(
  <StrictMode>
    <BwsOperatorCockpitBrowserRouter configuration={configuration} />
  </StrictMode>,
);
