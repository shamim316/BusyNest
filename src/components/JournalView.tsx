import { useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import RichTextEditor from './RichTextEditor'
import { todayStr, addDays, formatDateLong, formatDate } from '../lib/dates'

export default function JournalView() {
  const { date } = useParams()
  const navigate = useNavigate()
  const { pages, createPage, updatePage } = useData()
  const saveTimer = useRef<number | undefined>(undefined)

  const selected = date ?? todayStr()
  const entries = useMemo(
    () =>
      pages
        .filter((p) => p.kind === 'journal' && p.journal_date)
        .sort((a, b) => b.journal_date!.localeCompare(a.journal_date!)),
    [pages],
  )
  const entry = entries.find((e) => e.journal_date === selected)

  async function ensureEntry(): Promise<void> {
    if (entry) return
    await createPage({
      kind: 'journal',
      journal_date: selected,
      title: formatDateLong(selected),
      emoji: '✍️',
    })
  }

  function handleChange(html: string) {
    if (!entry) return
    const id = entry.id
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => updatePage(id, { content_html: html }), 700)
  }

  const isToday = selected === todayStr()

  return (
    <div className="journal">
      <aside className="journal__list">
        <div className="doctree__header">
          <h2>Journal</h2>
        </div>
        <button
          className={`journal__day ${isToday && !entry ? '' : ''} ${selected === todayStr() ? 'journal__day--active' : ''}`}
          onClick={() => navigate('/journal')}
        >
          ✍️ Today
        </button>
        {entries
          .filter((e) => e.journal_date !== todayStr())
          .map((e) => (
            <button
              key={e.id}
              className={`journal__day ${e.journal_date === selected ? 'journal__day--active' : ''}`}
              onClick={() => navigate(`/journal/${e.journal_date}`)}
            >
              {formatDate(e.journal_date!, { withYear: true })}
            </button>
          ))}
        {entries.length === 0 && (
          <p className="sidebar__hint">
            A private diary and activity log. Each day gets its own page.
          </p>
        )}
      </aside>

      <div className="journal__editor">
        <div className="journal__nav">
          <button className="btn btn--ghost" onClick={() => navigate(`/journal/${addDays(selected, -1)}`)}>← Prev day</button>
          <h1 className="journal__date">{formatDateLong(selected)}</h1>
          <button
            className="btn btn--ghost"
            disabled={selected >= todayStr()}
            onClick={() => navigate(`/journal/${addDays(selected, 1)}`)}
          >
            Next day →
          </button>
        </div>

        {entry ? (
          <RichTextEditor
            docId={entry.id}
            value={entry.content_html}
            onChange={handleChange}
            placeholder="What happened today? What did you work on, learn, feel?"
          />
        ) : (
          <div className="journal__start">
            <p className="muted">No entry for this day yet.</p>
            <button className="btn btn--primary" onClick={ensureEntry}>
              Start writing
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
