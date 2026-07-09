import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import { STATUS_LABELS, Task, TaskStatus } from '../lib/types'
import { dueLabel, formatDate } from '../lib/dates'

type SortKey = 'sort_order' | 'due_date' | 'priority' | 'title'

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

export default function TaskListView({ projectId }: { projectId: string }) {
  const { tasks, updateTask, openTask } = useData()
  const [sortKey, setSortKey] = useState<SortKey>('sort_order')
  const [showDone, setShowDone] = useState(true)

  const rows = useMemo(() => {
    let list = tasks.filter((t) => t.project_id === projectId)
    if (!showDone) list = list.filter((t) => t.status !== 'done')
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'due_date':
          return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
        case 'priority':
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return a.sort_order - b.sort_order
      }
    })
  }, [tasks, projectId, sortKey, showDone])

  function toggleDone(t: Task) {
    updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })
  }

  return (
    <div className="tasklist">
      <div className="tasklist__controls">
        <label className="small">
          Sort by{' '}
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="sort_order">Manual order</option>
            <option value="due_date">Due date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </label>
        <label className="small checkbox-label">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
          Show done
        </label>
      </div>

      <table className="tasktable">
        <thead>
          <tr>
            <th className="tasktable__check" />
            <th>Task</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Start</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const due = dueLabel(t.due_date)
            return (
              <tr key={t.id} className={t.status === 'done' ? 'row--done' : ''}>
                <td className="tasktable__check">
                  <input
                    type="checkbox"
                    checked={t.status === 'done'}
                    onChange={() => toggleDone(t)}
                    title="Mark done"
                  />
                </td>
                <td>
                  <button className="linklike tasktable__title" onClick={() => openTask(t.id)}>
                    {t.title}
                  </button>
                </td>
                <td>
                  <select
                    className="inline-select"
                    value={t.status}
                    onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })}
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className={`chip chip--prio-${t.priority}`}>{t.priority}</span>
                </td>
                <td className="small muted">{t.start_date ? formatDate(t.start_date) : '—'}</td>
                <td>
                  {due && t.status !== 'done'
                    ? <span className={`due due--${due.tone}`}>{due.text}</span>
                    : <span className="small muted">{t.due_date ? formatDate(t.due_date) : '—'}</span>}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="muted tasktable__empty">No tasks yet — add one above.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
