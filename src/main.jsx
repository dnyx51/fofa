import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import FOFA from './FOFA.jsx'
import PersonalPortal from './PersonalPortal.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import PublicLeaderboard from './PublicLeaderboard.jsx'

function App() {
  const [currentView, setCurrentView] = useState('site')

  useEffect(() => {
    const updateView = () => {
      const hash = window.location.hash
      // #join?ref=CODE goes to portal as register
      if (hash.startsWith('#join')) {
        // Convert to #portal but keep query params, AuthForm will read ?ref= itself
        setCurrentView('portal')
      } else if (hash === '#portal' || hash.startsWith('#portal?')) {
        setCurrentView('portal')
      } else if (hash === '#admin') {
        setCurrentView('admin')
      } else if (hash === '#leaders' || hash === '#leaderboard') {
        setCurrentView('leaders')
      } else {
        setCurrentView('site')
      }
    }

    updateView()
    window.addEventListener('hashchange', updateView)
    return () => window.removeEventListener('hashchange', updateView)
  }, [])

  return (
    <>
      {currentView === 'site' && <FOFA />}
      {currentView === 'portal' && <PersonalPortal />}
      {currentView === 'admin' && <AdminDashboard />}
      {currentView === 'leaders' && <PublicLeaderboard />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
