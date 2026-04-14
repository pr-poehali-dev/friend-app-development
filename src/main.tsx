import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { LangProvider } from './LangContext'

createRoot(document.getElementById("root")!).render(
  <LangProvider>
    <App />
  </LangProvider>
);
