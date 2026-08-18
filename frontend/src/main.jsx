import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const APP_BUILD = 'agon-register-autofill-fix-20260818-04'
const storedBuild = localStorage.getItem('agon_app_build')
if (storedBuild && storedBuild !== APP_BUILD && !sessionStorage.getItem('agon_build_refresh')) {
  sessionStorage.setItem('agon_build_refresh', '1')
  const url = new URL(window.location.href)
  url.searchParams.set('_v', APP_BUILD)
  window.location.replace(url.toString())
}
localStorage.setItem('agon_app_build', APP_BUILD)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
