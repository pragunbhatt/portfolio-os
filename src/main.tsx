import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installLiquidGlass, trackGlassLight } from './os/liquidGlass';
import './styles/base.css';
import './styles/hero.css';
import './styles/os.css';
import './styles/apps.css';
import './styles/tahoe.css';

window.__boot?.progress(0.45);
installLiquidGlass();
trackGlassLight();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
