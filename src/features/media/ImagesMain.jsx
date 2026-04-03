import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ImagesPage from './ImagesPage.jsx';
import { applyWebPlatformClass } from '../../platform/applyWebPlatformClass.js';
import '../../index.css';
import '../../styles/index.css';
import '../../styles/platform.css';

applyWebPlatformClass();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImagesPage />
  </StrictMode>,
);
