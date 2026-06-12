import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { LanguageProvider } from './shared/i18n/LanguageContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
