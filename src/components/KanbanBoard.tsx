import { useMemo, useState } from 'react'
import { useData, BOARD_COLUMNS } from '../context/DataContext'
import { STATUS_LABELS, Task, TaskStatus } from '../lib/types'
import { dueLabel } from '../lib/dates'

function TaskCard({ task, blockedByOpen }: { task: Task; blockedByOpen: boolean }) {
  const { openTask } = useData()
  const due = dueLabel(task.due_date)
  const hasNotes = task.notes_html && task.notes_html !== '<p></p>'

  return (
    <div
      className={`card task-card prio-${task.priority}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onClick={() => openTask(task.id)}
    >
      <div className="task-card__title">{task.title}</div>
      <div className="task-card__meta">
        {due && task.status !== 'done' && (
          <span className={`due due--${due.tone}`}>{due.text}</span>
        )}
        {blockedByOpen && <span className="chip chip--blocked" title="Waiting on another task">⛓ blocked</span>}
        {hasNotes && <span className="chip" title="Has notes">📝</span>}
        {task.priority === 'high' && <span className="chip chip--high">High</span>}
      </div>
    </div>
  )
}

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const { tasks, dependencies, updateTask } = useData()
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)

  const byStatus = useMemo(() => {
    const list = tasks
      .filter((t) => t.project_id === projectId)
      .sort((a, b) => a.sort_order - b.sort_order)
    return Object.fromEntries(
      BOARD_COLUMNS.map((s) => [s, list.filter((t) => t.status === s)]),
    ) as Record<TaskStatus, Task[]>
  }, [tasks, projectId])

  const openBlockerIds = useMemo(() => {
    const openIds = new Set(tasks.filter((t) => t.status !== 'done').map((t) => t.id))
    return new Set(
      dependencies
        .filter((d) => openIds.has(d.depends_on_task_id))
        .map((d) => d.task_id),
    )
  }, [tasks, dependencies])

  function handleDrop(status: TaskStatus, e: React.DragEvent) {
    e.preventDefault()
    setDragOver(null)
    const id = e.dataTransfer.getData('text/task-id')
    if (!id) return
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const col = byStatus[status]
    const newOrder = col.length ? col[col.length - 1].sort_order + 1000 : Date.now()
    updateTask(id, { status, sort_order: newOrder })
  }

  return (
    <div className="board">
      {BOARD_COLUMNS.map((status) => (
        <section
          key={status}
          className={`board-col ${dragOver === status ? 'board-col--over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(status) }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => handleDrop(status, e)}
        >
          <header className={`board-col__header board-col__header--${status}`}>
            {STATUS_LABELS[status]}
            <span className="board-col__count">{byStatus[status].length}</span>
          </header>
          <div className="board-col__cards">
            {byStatus[status].map((t) => (
              <TaskCard key={t.id} task={t} blockedByOpen={openBlockerIds.has(t.id) && status !== 'done'} />
            ))}
            {byStatus[status].length === 0 && (
              <div className="board-col__empty">Drop tasks here</div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
