import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChildLocatorProvider } from './index'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChildLocatorProvider>
      <App />
    </ChildLocatorProvider>
  </StrictMode>,
)
