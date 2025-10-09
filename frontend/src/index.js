import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>  ← Commentez cette ligne
    <App />
  // </React.StrictMode>  ← Commentez cette ligne
);

reportWebVitals();