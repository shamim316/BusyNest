import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { isConfigured } from './lib/supabase'
import AuthPage from './components/AuthPage'
import AppLayout from './components/AppLayout'
import Dashboard from './components/Dashboard'
import ProjectView from './components/ProjectView'
import DocsView from './components/DocsView'
import JournalView from './components/JournalView'

function ConfigNeeded() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand brand--lg">
          <img src="/nest.svg" alt="" className="brand__logo" />
          <span className="brand__name">BusyNest</span>
        </div>
        <h1>Almost there!</h1>
        <p className="muted">
          BusyNest isn&apos;t connected to Supabase yet. Set the{' '}
          <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> environment
          variables in Easypanel (or edit <code>public/config.js</code> for local
          use), then reload this page. The README walks through every step.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (!isConfigured) return <ConfigNeeded />

  if (loading) {
    return (
      <div className="full-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    )
  }

  if (!session) return <AuthPage />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects/:projectId" element={<ProjectView />} />
        <Route path="projects/:projectId/:view" element={<ProjectView />} />
        <Route path="docs" element={<DocsView />} />
        <Route path="docs/:pageId" element={<DocsView />} />
        <Route path="journal" element={<JournalView />} />
        <Route path="journal/:date" element={<JournalView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
