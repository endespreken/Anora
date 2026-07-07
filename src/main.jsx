import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

// Global haptic feedback for interactive elements (Native Mobile only)
if (Capacitor.isNativePlatform()) {
  document.addEventListener('touchstart', (e) => {
    // Check if vibration is enabled in settings (defaults to true)
    const isVibrationEnabled = localStorage.getItem('anora_vibration_enabled') !== 'false';
    
    // Only trigger for elements that are explicitly interactive
    if (isVibrationEnabled && e.target.closest('button, a, [role="button"], .cursor-pointer')) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
  }, { passive: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
