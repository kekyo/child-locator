import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TetherProvider } from './index'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TetherProvider>
      <App />
    </TetherProvider>
  </StrictMode>,
)
