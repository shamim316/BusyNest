import { useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { Page } from '../lib/types'
import RichTextEditor from './RichTextEditor'
import { formatDate } from '../lib/dates'

const EMOJIS = ['📄', '📝', '📌', '💡', '🎯', '📊', '🧭', '🛠', '🌱', '⭐', '🏡', '💰', '✈️', '🍳', '🏋️', '🎨']

function PageTreeItem({
  page, depth, activeId, childrenOf, onSelect,
}: {
  page: Page
  depth: number
  activeId?: string
  childrenOf: Map<string | null, Page[]>
  onSelect: (id: string) => void
}) {
  const kids = childrenOf.get(page.id) ?? []
  return (
    <>
      <button
        className={`doctree__item ${page.id === activeId ? 'doctree__item--active' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onSelect(page.id)}
      >
        <span className="doctree__emoji">{page.emoji || '📄'}</span>
        <span className="doctree__title">{page.title || 'Untitled'}</span>
      </button>
      {kids.map((k) => (
        <PageTreeItem key={k.id} page={k} depth={depth + 1} activeId={activeId} childrenOf={childrenOf} onSelect={onSelect} />
      ))}
    </>
  )
}

export default function DocsView() {
  const { pageId } = useParams()
  const navigate = useNavigate()
  const { pages, createPage, updatePage, deletePage } = useData()
  const saveTimer = useRef<number | undefined>(undefined)

  const docs = useMemo(() => pages.filter((p) => p.kind === 'page'), [pages])
  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Page[]>()
    for (const p of docs) {
      const key = p.parent_id && docs.some((d) => d.id === p.parent_id) ? p.parent_id : null
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    for (const list of map.values()) list.sort((a, b) => a.sort_order - b.sort_order)
    return map
  }, [docs])

  const current = docs.find((p) => p.id === pageId)

  async function handleNewPage(parentId: string | null = null) {
    const page = await createPage({ parent_id: parentId, title: '', emoji: '📄' })
    if (page) navigate(`/docs/${page.id}`)
  }

  function handleContentChange(html: string) {
    if (!current) return
    const id = current.id
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => updatePage(id, { content_html: html }), 700)
  }

  function cycleEmoji() {
    if (!current) return
    const i = EMOJIS.indexOf(current.emoji)
    updatePage(current.id, { emoji: EMOJIS[(i + 1) % EMOJIS.length] })
  }

  function handleDelete() {
    if (!current) return
    if (window.confirm(`Delete “${current.title || 'Untitled'}” and its sub-pages?`)) {
      deletePage(current.id)
      navigate('/docs')
    }
  }

  return (
    <div className="docs">
      <aside className="doctree">
        <div className="doctree__header">
          <h2>Docs</h2>
          <button className="iconbtn" title="New page" onClick={() => handleNewPage(null)}>+</button>
        </div>
        <div className="doctree__list">
          {(childrenOf.get(null) ?? []).map((p) => (
            <PageTreeItem key={p.id} page={p} depth={0} activeId={pageId} childrenOf={childrenOf} onSelect={(id) => navigate(`/docs/${id}`)} />
          ))}
          {docs.length === 0 && (
            <p className="sidebar__hint">
              This is your knowledge base — meeting notes, project status pages, references, anything. Click + to create your first page.
            </p>
          )}
        </div>
      </aside>

      <div className="docs__editor">
        {current ? (
          <>
            <div className="docs__pagebar">
              <button className="docs__emoji" onClick={cycleEmoji} title="Change icon">
                {current.emoji || '📄'}
              </button>
              <span className="small muted">Updated {formatDate(current.updated_at.slice(0, 10), { withYear: true })}</span>
              <span className="spacer" />
              <button className="btn btn--ghost" onClick={() => handleNewPage(current.id)}>+ Sub-page</button>
              <button className="iconbtn iconbtn--danger" title="Delete page" onClick={handleDelete}>🗑</button>
            </div>
            <input
              className="docs__title"
              key={current.id}
              defaultValue={current.title}
              placeholder="Untitled"
              onBlur={(e) => {
                if (e.target.value !== current.title) updatePage(current.id, { title: e.target.value })
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
            <RichTextEditor
              docId={current.id}
              value={current.content_html}
              onChange={handleContentChange}
              placeholder="Write anything — status updates, howtos, ideas…"
            />
          </>
        ) : (
          <div className="docs__none">
            <h1>📚 Your knowledge base</h1>
            <p className="muted">
              Select a page on the left, or create a new one. Pages can be nested
              to build project documentation, summaries and references — just
              like Confluence, but yours.
            </p>
            <button className="btn btn--primary" onClick={() => handleNewPage(null)}>Create a page</button>
          </div>
        )}
      </div>
    </div>
  )
}
