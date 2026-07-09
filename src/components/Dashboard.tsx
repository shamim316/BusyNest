import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { dueLabel, todayStr, formatDateLong } from '../lib/dates'
import { Task } from '../lib/types'

function TaskRow({ task }: { task: Task }) {
  const { projects, openTask, updateTask } = useData()
  const project = projects.find((p) => p.id === task.project_id)
  const due = dueLabel(task.due_date)
  return (
    <div className="dash-task">
      <input
        type="checkbox"
        checked={task.status === 'done'}
        onChange={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
      />
      <button className="linklike dash-task__title" onClick={() => openTask(task.id)}>
        {task.title}
      </button>
      {project && (
        <span className="dash-task__project">
          <span className="project-dot" style={{ background: project.color }} />
          {project.name}
        </span>
      )}
      {due && <span className={`due due--${due.tone}`}>{due.text}</span>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { projects, tasks, pages, ready } = useData()
  const navigate = useNavigate()

  const displayName: string =
    (user?.user_metadata?.display_name as string) || user?.email?.split('@')[0] || 'there'

  const today = todayStr()
  const open = tasks.filter((t) => t.status !== 'done')
  const overdue = open.filter((t) => t.due_date && t.due_date < today)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
  const dueToday = open.filter((t) => t.due_date === today)
  const upcoming = open
    .filter((t) => t.due_date && t.due_date > today)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
    .slice(0, 8)

  const recentPages = [...pages]
    .filter((p) => p.kind === 'page')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 6)

  const activeProjects = projects.filter((p) => !p.is_archived)

  if (!ready) {
    return <div className="full-center"><div className="spinner" /></div>
  }

  return (
    <div className="page dashboard">
      <header className="dashboard__hello">
        <h1>Hello, {displayName} 👋</h1>
        <p className="muted">{formatDateLong(today)}</p>
      </header>

      <div className="dashboard__grid">
        <section className="panel">
          <h2>🔥 Needs attention</h2>
          {overdue.length === 0 && dueToday.length === 0 ? (
            <p className="muted">Nothing overdue and nothing due today. Enjoy the calm!</p>
          ) : (
            <>
              {overdue.map((t) => <TaskRow key={t.id} task={t} />)}
              {dueToday.map((t) => <TaskRow key={t.id} task={t} />)}
            </>
          )}
        </section>

        <section className="panel">
          <h2>📅 Coming up</h2>
          {upcoming.length === 0 ? (
            <p className="muted">No upcoming due dates. Open a task to schedule it.</p>
          ) : (
            upcoming.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </section>

        <section className="panel">
          <h2>🗂 Projects</h2>
          {activeProjects.length === 0 && (
            <p className="muted">No projects yet. Create one from the sidebar.</p>
          )}
          <div className="dash-projects">
            {activeProjects.map((p) => {
              const pt = tasks.filter((t) => t.project_id === p.id)
              const done = pt.filter((t) => t.status === 'done').length
              const pct = pt.length ? Math.round((done / pt.length) * 100) : 0
              return (
                <button key={p.id} className="dash-project" onClick={() => navigate(`/projects/${p.id}/board`)}>
                  <span className="dash-project__name">
                    <span className="project-dot" style={{ background: p.color }} />
                    {p.name}
                  </span>
                  <span className="progress"><span className="progress__fill" style={{ width: `${pct}%`, background: p.color }} /></span>
                  <span className="small muted">{done}/{pt.length} tasks</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <h2>📚 Recent docs</h2>
          {recentPages.length === 0 ? (
            <p className="muted">No pages yet. <Link to="/docs">Create your first doc</Link>.</p>
          ) : (
            <div className="dash-pages">
              {recentPages.map((p) => (
                <Link key={p.id} to={`/docs/${p.id}`} className="dash-page">
                  <span className="dash-page__emoji">{p.emoji || '📄'}</span>
                  {p.title || 'Untitled'}
                </Link>
              ))}
            </div>
          )}
          <Link to="/journal" className="btn btn--ghost dashboard__journal-btn">
            ✍️ Open today&apos;s journal
          </Link>
        </section>
      </div>
    </div>
  )
}
