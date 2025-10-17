import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { registerSW } from './registerServiceWorker.ts'
import { syncManager } from './utils/syncManager.ts'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerSW()

// Iniciar sincronización automática
syncManager.startAutoSync()
