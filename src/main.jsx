import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register';


registerSW({
  onNeedRefresh() {
    console.log('Nova atualização disponível.');
  },
  onOfflineReady() {
    console.log('O aplicativo está pronto para uso offline.');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)