import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ImagesPage from './ImagesPage.jsx';
import '../../index.css';
import '../../styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImagesPage />
  </StrictMode>,
);
