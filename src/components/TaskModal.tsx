import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../context/DataContext'
import { STATUS_LABELS, PRIORITY_LABELS, TaskStatus, Priority } from '../lib/types'
import RichTextEditor from './RichTextEditor'
import { dueLabel } from '../lib/dates'

export default function TaskModal({ taskId }: { taskId: string }) {
  const {
    tasks, projects, dependencies,
    updateTask, deleteTask, openTask,
    addDependency, removeDependency,
  } = useData()

  const task = tasks.find((t) => t.id === taskId)
  const [title, setTitle] = useState(task?.title ?? '')
  const [depPicker, setDepPicker] = useState('')
  const notesTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setTitle(task?.title ?? '')
  }, [taskId])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openTask(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openTask])

  const blockedBy = useMemo(
    () => dependencies.filter((d) => d.task_id === taskId),
    [dependencies, taskId],
  )
  const blocks = useMemo(
    () => dependencies.filter((d) => d.depends_on_task_id === taskId),
    [dependencies, taskId],
  )

  if (!task) return null
  const project = projects.find((p) => p.id === task.project_id)

  const candidateTasks = tasks.filter(
    (t) =>
      t.id !== taskId &&
      t.project_id === task.project_id &&
      !blockedBy.some((d) => d.depends_on_task_id === t.id),
  )

  function commitTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task!.title) updateTask(taskId, { title: trimmed })
  }

  function handleNotesChange(html: string) {
    window.clearTimeout(notesTimer.current)
    notesTimer.current = window.setTimeout(() => updateTask(taskId, { notes_html: html }), 600)
  }

  const due = dueLabel(task.due_date)

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) openTask(null) }}>
      <div className="modal task-modal" role="dialog" aria-modal="true">
        <header className="task-modal__header">
          <span className="task-modal__project">
            <span className="project-dot" style={{ background: project?.color }} />
            {project?.name}
          </span>
          <div className="task-modal__header-actions">
            <button
              className="iconbtn iconbtn--danger"
              title="Delete task"
              onClick={() => {
                if (window.confirm('Delete this task? This cannot be undone.')) {
                  deleteTask(taskId)
                  openTask(null)
                }
              }}
            >
              🗑
            </button>
            <button className="iconbtn" title="Close" onClick={() => openTask(null)}>✕</button>
          </div>
        </header>

        <input
          className="task-modal__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="Task title"
        />

        <div className="task-modal__grid">
          <label className="field">
            <span className="field__label">Status</span>
            <select
              value={task.status}
              onChange={(e) => updateTask(taskId, { status: e.target.value as TaskStatus })}
            >
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Priority</span>
            <select
              value={task.priority}
              onChange={(e) => updateTask(taskId, { priority: e.target.value as Priority })}
            >
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Start date</span>
            <input
              type="date"
              value={task.start_date ?? ''}
              onChange={(e) => updateTask(taskId, { start_date: e.target.value || null })}
            />
          </label>
          <label className="field">
            <span className="field__label">
              Due date {due && <em className={`due due--${due.tone}`}>{due.text}</em>}
            </span>
            <input
              type="date"
              value={task.due_date ?? ''}
              onChange={(e) => updateTask(taskId, { due_date: e.target.value || null })}
            />
          </label>
        </div>

        <section className="task-modal__section">
          <h3>Dependencies</h3>
          {blockedBy.length === 0 && blocks.length === 0 && (
            <p className="muted small">No dependencies yet. Pick a task below that must finish before this one can start.</p>
          )}
          {blockedBy.length > 0 && (
            <div className="dep-group">
              <span className="dep-group__label">Blocked by</span>
              {blockedBy.map((d) => {
                const other = tasks.find((t) => t.id === d.depends_on_task_id)
                return (
                  <span key={d.id} className={`dep-chip ${other?.status === 'done' ? 'dep-chip--done' : ''}`}>
                    <button className="dep-chip__link" onClick={() => openTask(d.depends_on_task_id)}>
                      {other?.title ?? 'Unknown task'}
                    </button>
                    <button className="dep-chip__remove" title="Remove" onClick={() => removeDependency(d.id)}>✕</button>
                  </span>
                )
              })}
            </div>
          )}
          {blocks.length > 0 && (
            <div className="dep-group">
              <span className="dep-group__label">Blocks</span>
              {blocks.map((d) => {
                const other = tasks.find((t) => t.id === d.task_id)
                return (
                  <span key={d.id} className="dep-chip">
                    <button className="dep-chip__link" onClick={() => openTask(d.task_id)}>
                      {other?.title ?? 'Unknown task'}
                    </button>
                    <button className="dep-chip__remove" title="Remove" onClick={() => removeDependency(d.id)}>✕</button>
                  </span>
                )
              })}
            </div>
          )}
          <div className="dep-add">
            <select value={depPicker} onChange={(e) => setDepPicker(e.target.value)}>
              <option value="">Add a “blocked by” task…</option>
              {candidateTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <button
              className="btn"
              disabled={!depPicker}
              onClick={() => { addDependency(taskId, depPicker); setDepPicker('') }}
            >
              Add
            </button>
          </div>
        </section>

        <section className="task-modal__section task-modal__notes">
          <h3>Notes</h3>
          <RichTextEditor
            docId={taskId}
            value={task.notes_html}
            onChange={handleNotesChange}
            placeholder="Add details, links, checklists…"
            compact
          />
        </section>
      </div>
    </div>
  )
}
