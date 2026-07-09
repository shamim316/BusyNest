import { useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

interface Props {
  /** HTML to show. The editor only resets when `docId` changes, so remote
   *  updates to the doc you are actively typing in won't stomp your cursor. */
  value: string
  docId: string
  placeholder?: string
  onChange: (html: string) => void
  compact?: boolean
}

function ToolbarButton({
  editor,
  action,
  active,
  label,
  title,
}: {
  editor: Editor
  action: () => void
  active?: boolean
  label: string
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      className={`rte-btn ${active ? 'rte-btn--active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()
        action()
      }}
    >
      {label}
    </button>
  )
}

export default function RichTextEditor({ value, docId, placeholder, onChange, compact }: Props) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
        Link.configure({ openOnClick: true, autolink: true }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: value || '',
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    },
    [docId],
  )

  // If the doc content changes remotely while this editor is NOT focused,
  // reflect the change (real-time updates from another device/tab).
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) return null

  function setLink() {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL:', prev ?? 'https://')
    if (url === null) return
    if (url === '') editor.chain().focus().unsetLink().run()
    else editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className={`rte ${compact ? 'rte--compact' : ''}`}>
      <div className="rte-toolbar">
        <ToolbarButton editor={editor} label="B" title="Bold"
          active={editor.isActive('bold')}
          action={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton editor={editor} label="I" title="Italic"
          active={editor.isActive('italic')}
          action={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton editor={editor} label="S" title="Strikethrough"
          active={editor.isActive('strike')}
          action={() => editor.chain().focus().toggleStrike().run()} />
        <span className="rte-sep" />
        <ToolbarButton editor={editor} label="H1" title="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolbarButton editor={editor} label="H2" title="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton editor={editor} label="H3" title="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <span className="rte-sep" />
        <ToolbarButton editor={editor} label="•" title="Bullet list"
          active={editor.isActive('bulletList')}
          action={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton editor={editor} label="1." title="Numbered list"
          active={editor.isActive('orderedList')}
          action={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton editor={editor} label="☑" title="Checklist"
          active={editor.isActive('taskList')}
          action={() => editor.chain().focus().toggleTaskList().run()} />
        <span className="rte-sep" />
        <ToolbarButton editor={editor} label="❝" title="Quote"
          active={editor.isActive('blockquote')}
          action={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton editor={editor} label="{ }" title="Code block"
          active={editor.isActive('codeBlock')}
          action={() => editor.chain().focus().toggleCodeBlock().run()} />
        <ToolbarButton editor={editor} label="🔗" title="Link"
          active={editor.isActive('link')} action={setLink} />
        <span className="rte-sep" />
        <ToolbarButton editor={editor} label="―" title="Divider"
          action={() => editor.chain().focus().setHorizontalRule().run()} />
      </div>
      <EditorContent editor={editor} className="rte-content" />
    </div>
  )
}
