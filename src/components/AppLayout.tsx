import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { PROJECT_COLORS } from '../lib/types'
import TaskModal from './TaskModal'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const { projects, createProject, openTaskId } = useData()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const displayName: string =
    (user?.user_metadata?.display_name as string) || user?.email?.split('@')[0] || 'You'

  async function handleNewProject() {
    const name = window.prompt('Name your new project:')
    if (!name?.trim()) return
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length]
    const project = await createProject({ name: name.trim(), color })
    if (project) navigate(`/projects/${project.id}/board`)
  }

  const active = projects.filter((p) => !p.is_archived)

  return (
    <div className="app-shell">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <img src="/nest.svg" alt="" className="brand__logo" />
          <span className="brand__name">BusyNest</span>
        </div>

        <nav className="sidebar__nav" onClick={() => setSidebarOpen(false)}>
          <NavLink to="/" end className="nav-item">
            <span className="nav-item__icon">🏠</span> Home
          </NavLink>
          <NavLink to="/docs" className="nav-item">
            <span className="nav-item__icon">📚</span> Docs
          </NavLink>
          <NavLink to="/journal" className="nav-item">
            <span className="nav-item__icon">✍️</span> Journal
          </NavLink>

          <div className="sidebar__section">
            <span>Projects</span>
            <button className="iconbtn" onClick={(e) => { e.stopPropagation(); handleNewProject() }} title="New project">
              +
            </button>
          </div>

          {active.map((p) => (
            <NavLink key={p.id} to={`/projects/${p.id}/board`} className="nav-item nav-item--project">
              <span className="project-dot" style={{ background: p.color }} />
              <span className="nav-item__label">{p.name}</span>
            </NavLink>
          ))}
          {active.length === 0 && (
            <p className="sidebar__hint">No projects yet — click + to start one.</p>
          )}
        </nav>

        <div className="sidebar__footer">
          <div className="userchip">
            <div className="userchip__avatar">{displayName.slice(0, 1).toUpperCase()}</div>
            <div className="userchip__name">{displayName}</div>
          </div>
          <button className="linklike" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>

      {openTaskId && <TaskModal taskId={openTaskId} />}
    </div>
  )
}
