import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MarketPage from './MarketPage.jsx';
import '../../index.css';
import '../../styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MarketPage />
  </StrictMode>,
);
