import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './Client/context/CartContext'
import { AuthProvider } from './Client/context/AuthContext'

// Silence THREE.Clock deprecation warnings coming from third-party libraries (Fiber/Drei)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) return;
  originalWarn(...args);
};

// Automatically reload page if a lazy-loaded chunk fails (e.g. after a new deployment on Vercel)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (missing chunk). Reloading page...');
  window.location.reload();
});


import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);

