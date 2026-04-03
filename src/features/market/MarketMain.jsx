import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MarketPage from './MarketPage.jsx';
import { applyWebPlatformClass } from '../../platform/applyWebPlatformClass.js';
import '../../index.css';
import '../../styles/index.css';
import '../../styles/platform.css';

applyWebPlatformClass();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MarketPage />
  </StrictMode>,
);
