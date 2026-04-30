import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import FOFA from './FOFA.jsx'
import PersonalPortal from './PersonalPortal.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import PublicLeaderboard from './PublicLeaderboard.jsx'
import ClubApplyForm from './ClubApplyForm.jsx'
import ClubsPage from './ClubsPage.jsx'
import ExpertsPage from './ExpertsPage.jsx'
import ExpertApplyForm from './ExpertApplyForm.jsx'

function App() {
  const [currentView, setCurrentView] = useState('site')

  useEffect(() => {
    const updateView = () => {
      const hash = window.location.hash
      
      // Routes - more specific first
      if (hash === '#experts/apply') {
        setCurrentView('experts-apply')
      } else if (hash === '#experts' || hash.match(/^#experts\/[a-z0-9-]+$/)) {
        setCurrentView('experts')
      } else if (hash === '#clubs/apply' || hash === '#apply') {
        setCurrentView('clubs-apply')
      } else if (hash === '#clubs' || hash.match(/^#clubs\/[a-z0-9-]+$/)) {
        setCurrentView('clubs')
      } else if (hash.startsWith('#join')) {
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
      {currentView === 'clubs-apply' && <ClubApplyForm />}
      {currentView === 'clubs' && <ClubsPage />}
      {currentView === 'experts' && <ExpertsPage />}
      {currentView === 'experts-apply' && <ExpertApplyForm />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
