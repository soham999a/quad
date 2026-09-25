import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyTheme, resolveTheme } from './lib/theme'
import './i18n'
import './lib/errorReport' // installs window error + unhandledrejection handlers

applyTheme(resolveTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
