import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import '@telegram-apps/telegram-ui/dist/styles.css';
import './index.css';

// biome-ignore lint/style/noNonNullAssertion: root element всегда существует
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
