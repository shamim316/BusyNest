import { useState } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { PROJECT_COLORS } from '../lib/types'
import KanbanBoard from './KanbanBoard'
import TaskListView from './TaskListView'
import GanttChart from './GanttChart'

export default function ProjectView() {
  const { projectId, view = 'board' } = useParams()
  const navigate = useNavigate()
  const { projects, tasks, updateProject, deleteProject, createTask, openTask } = useData()
  const [quickAdd, setQuickAdd] = useState('')

  const project = projects.find((p) => p.id === projectId)
  if (!project) {
    return (
      <div className="page">
        <p className="muted">This project doesn&apos;t exist (it may have been deleted).</p>
      </div>
    )
  }

  const projectTasks = tasks.filter((t) => t.project_id === project.id)
  const doneCount = projectTasks.filter((t) => t.status === 'done').length

  async function handleQuickAdd() {
    const title = quickAdd.trim()
    if (!title) return
    setQuickAdd('')
    const t = await createTask({ project_id: project!.id, title })
    if (t && view !== 'board' && view !== 'list') openTask(t.id)
  }

  function cycleColor() {
    const i = PROJECT_COLORS.indexOf(project!.color)
    updateProject(project!.id, {
      color: PROJECT_COLORS[(i + 1) % PROJECT_COLORS.length],
    })
  }

  function handleDelete() {
    if (window.confirm(`Delete “${project!.name}” and all of its tasks? This cannot be undone.`)) {
      deleteProject(project!.id)
      navigate('/')
    }
  }

  return (
    <div className="page project-page">
      <header className="project-header">
        <button
          className="project-dot project-dot--lg"
          style={{ background: project.color }}
          onClick={cycleColor}
          title="Change color"
        />
        <input
          className="project-header__name"
          defaultValue={project.name}
          key={project.id + project.name}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v && v !== project.name) updateProject(project.id, { name: v })
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <span className="project-header__meta">
          {doneCount}/{projectTasks.length} done
        </span>
        <button className="iconbtn iconbtn--danger" title="Delete project" onClick={handleDelete}>🗑</button>
      </header>

      <div className="project-toolbar">
        <nav className="tabs">
          <NavLink to={`/projects/${project.id}/board`} className="tab">Board</NavLink>
          <NavLink to={`/projects/${project.id}/list`} className="tab">List</NavLink>
          <NavLink to={`/projects/${project.id}/gantt`} className="tab">Timeline</NavLink>
        </nav>
        <div className="quickadd">
          <input
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            placeholder="Add a task and press Enter…"
          />
          <button className="btn btn--primary" onClick={handleQuickAdd} disabled={!quickAdd.trim()}>
            Add
          </button>
        </div>
      </div>

      {view === 'board' && <KanbanBoard projectId={project.id} />}
      {view === 'list' && <TaskListView projectId={project.id} />}
      {view === 'gantt' && <GanttChart projectId={project.id} />}
    </div>
  )
}
