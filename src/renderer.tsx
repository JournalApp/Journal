import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { App } from './App';

function renderApp() {
  const container = document.getElementById('app');
  const root = createRoot(container!);

  root.render(<App />);
}

document.fonts.load('12px "Inter var"').then(() => renderApp());
