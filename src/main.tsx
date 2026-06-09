// Polyfill crypto.randomUUID for older mobile browsers
if (!crypto.randomUUID) {
  (crypto as any).randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import MelvinErrorBoundary from './components/MelvinErrorBoundary.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MelvinErrorBoundary>
      <App />
    </MelvinErrorBoundary>
  </React.StrictMode>,
)