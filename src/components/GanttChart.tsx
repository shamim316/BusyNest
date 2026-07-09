import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { Task } from '../lib/types'
import { addDays, diffDays, parseDate, todayStr, formatDate } from '../lib/dates'

const DAY_W = 28
const ROW_H = 40
const BAR_H = 22

interface Bar {
  task: Task
  row: number
  startCol: number // day index of bar start
  endCol: number // day index AFTER bar end (exclusive)
}

export default function GanttChart({ projectId }: { projectId: string }) {
  const { tasks, dependencies, openTask } = useData()

  const projectTasks = tasks.filter((t) => t.project_id === projectId)
  const dated = projectTasks
    .filter((t) => t.start_date || t.due_date)
    .sort((a, b) =>
      (a.start_date ?? a.due_date ?? '').localeCompare(b.start_date ?? b.due_date ?? ''),
    )
  const undated = projectTasks.filter((t) => !t.start_date && !t.due_date)

  const { rangeStart, totalDays, bars, months } = useMemo(() => {
    const today = todayStr()
    let min = today
    let max = today
    for (const t of dated) {
      const s = t.start_date ?? t.due_date!
      const e = t.due_date ?? t.start_date!
      if (s < min) min = s
      if (e > max) max = e
    }
    const rangeStart = addDays(min, -3)
    const rangeEnd = addDays(max, 14)
    const totalDays = diffDays(rangeStart, rangeEnd) + 1

    const bars: Bar[] = dated.map((task, i) => {
      const s = task.start_date ?? task.due_date!
      const e = task.due_date ?? task.start_date!
      return {
        task,
        row: i,
        startCol: diffDays(rangeStart, s),
        endCol: diffDays(rangeStart, e) + 1,
      }
    })

    // Month header segments
    const months: { label: string; startCol: number; days: number }[] = []
    for (let i = 0; i < totalDays; i++) {
      const d = parseDate(addDays(rangeStart, i))
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      const last = months[months.length - 1]
      if (last && last.label === label) last.days++
      else months.push({ label, startCol: i, days: 1 })
    }

    return { rangeStart, totalDays, bars, months }
  }, [dated.map((t) => `${t.id}:${t.start_date}:${t.due_date}`).join(',')])

  if (dated.length === 0) {
    return (
      <div className="gantt-empty">
        <p className="muted">
          The timeline shows tasks that have a start or due date.
          Open a task and give it dates to see it here.
        </p>
      </div>
    )
  }

  const todayCol = diffDays(rangeStart, todayStr())
  const barById = new Map(bars.map((b) => [b.task.id, b]))
  const chartW = totalDays * DAY_W
  const chartH = bars.length * ROW_H

  // Dependency arrows between two dated tasks in this project
  const arrows = dependencies
    .map((d) => {
      const from = barById.get(d.depends_on_task_id)
      const to = barById.get(d.task_id)
      if (!from || !to) return null
      const x1 = from.endCol * DAY_W
      const y1 = from.row * ROW_H + ROW_H / 2
      const x2 = to.startCol * DAY_W
      const y2 = to.row * ROW_H + ROW_H / 2
      const bend = Math.max(14, Math.min(30, (x2 - x1) / 2))
      const path =
        x2 > x1 + 20
          ? `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2 - 4} ${y2}`
          : `M ${x1} ${y1} C ${x1 + 24} ${y1}, ${x2 - 24} ${y2}, ${x2 - 4} ${y2}`
      return { id: d.id, path }
    })
    .filter(Boolean) as { id: string; path: string }[]

  return (
    <div className="gantt">
      <div className="gantt__scroll">
        {/* Fixed label column */}
        <div className="gantt__labels" style={{ paddingTop: 52 }}>
          {bars.map((b) => (
            <button
              key={b.task.id}
              className={`gantt__label ${b.task.status === 'done' ? 'gantt__label--done' : ''}`}
              style={{ height: ROW_H }}
              onClick={() => openTask(b.task.id)}
              title={b.task.title}
            >
              {b.task.title}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="gantt__timeline" style={{ width: chartW }}>
          <div className="gantt__months">
            {months.map((m) => (
              <div key={m.label} className="gantt__month" style={{ width: m.days * DAY_W }}>
                {m.days * DAY_W > 90 ? m.label : ''}
              </div>
            ))}
          </div>
          <div className="gantt__days">
            {Array.from({ length: totalDays }, (_, i) => {
              const d = parseDate(addDays(rangeStart, i))
              const weekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div key={i} className={`gantt__day ${weekend ? 'gantt__day--wknd' : ''}`} style={{ width: DAY_W }}>
                  {d.getDate()}
                </div>
              )
            })}
          </div>

          <div className="gantt__grid" style={{ height: chartH, width: chartW }}>
            {/* weekend + day gridlines */}
            {Array.from({ length: totalDays }, (_, i) => {
              const d = parseDate(addDays(rangeStart, i))
              const weekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div
                  key={i}
                  className={`gantt__col ${weekend ? 'gantt__col--wknd' : ''}`}
                  style={{ left: i * DAY_W, width: DAY_W }}
                />
              )
            })}

            {/* today line */}
            {todayCol >= 0 && todayCol < totalDays && (
              <div className="gantt__today" style={{ left: todayCol * DAY_W + DAY_W / 2 }}>
                <span className="gantt__today-flag">Today</span>
              </div>
            )}

            {/* dependency arrows */}
            <svg className="gantt__arrows" width={chartW} height={chartH}>
              <defs>
                <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <polygon points="0 0, 7 3.5, 0 7" className="gantt__arrowhead" />
                </marker>
              </defs>
              {arrows.map((a) => (
                <path key={a.id} d={a.path} className="gantt__arrow" markerEnd="url(#arrowhead)" />
              ))}
            </svg>

            {/* bars */}
            {bars.map((b) => {
              const w = Math.max(1, b.endCol - b.startCol) * DAY_W - 6
              return (
                <button
                  key={b.task.id}
                  className={`gantt__bar gantt__bar--${b.task.status} prio-${b.task.priority}`}
                  style={{
                    left: b.startCol * DAY_W + 3,
                    top: b.row * ROW_H + (ROW_H - BAR_H) / 2,
                    width: w,
                    height: BAR_H,
                  }}
                  onClick={() => openTask(b.task.id)}
                  title={`${b.task.title} (${formatDate(b.task.start_date ?? b.task.due_date)} → ${formatDate(b.task.due_date ?? b.task.start_date)})`}
                >
                  {w > 70 ? b.task.title : ''}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {undated.length > 0 && (
        <p className="muted small gantt__undated">
          {undated.length} task{undated.length > 1 ? 's' : ''} without dates — open them to add dates:
          {' '}
          {undated.slice(0, 5).map((t, i) => (
            <span key={t.id}>
              {i > 0 && ', '}
              <button className="linklike" onClick={() => openTask(t.id)}>{t.title}</button>
            </span>
          ))}
          {undated.length > 5 && '…'}
        </p>
      )}
    </div>
  )
}
