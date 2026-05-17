import { useEffect, useState, useCallback, useRef } from 'react'
import { Lock, Unlock, PanelLeft } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Editor } from '@/components/Editor'
import { LockDialog } from '@/components/LockDialog'
import {
  loadNotes,
  saveNotes,
  newNote,
  isUnlocked,
  lock,
  type Note,
} from '@/lib/storage'

function extractTitle(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 'Untitled'
  return text.slice(0, 60)
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editable, setEditable] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    const loaded = loadNotes()
    setNotes(loaded)
    if (loaded.length > 0) setActiveId(loaded[0].id)
    setEditable(isUnlocked())
  }, [])

  const active = notes.find((n) => n.id === activeId) ?? null

  const persist = useCallback((next: Note[]) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => saveNotes(next), 250)
  }, [])

  const handleCreate = () => {
    const n = newNote()
    const next = [n, ...notes]
    setNotes(next)
    setActiveId(n.id)
    persist(next)
  }

  const handleDelete = (id: string) => {
    const next = notes.filter((n) => n.id !== id)
    setNotes(next)
    if (activeId === id) setActiveId(next[0]?.id ?? null)
    persist(next)
  }

  const handleChange = (html: string) => {
    if (!active) return
    const next = notes.map((n) =>
      n.id === active.id
        ? { ...n, content: html, title: extractTitle(html), updatedAt: Date.now() }
        : n,
    )
    setNotes(next)
    persist(next)
  }

  const toggleLock = () => {
    if (editable) {
      lock()
      setEditable(false)
    } else {
      setLockOpen(true)
    }
  }

  return (
    <div className="h-full w-full flex bg-[var(--color-bg)]">
      {!collapsed && (
        <div className="w-[30%] min-w-[220px] max-w-[420px] h-full">
          <Sidebar
            notes={notes}
            activeId={activeId}
            editable={editable}
            onSelect={setActiveId}
            onCreate={handleCreate}
            onDelete={handleDelete}
            onCollapse={() => setCollapsed(true)}
          />
        </div>
      )}

      <main className="flex-1 h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
                title="Show sidebar"
              >
                <PanelLeft size={16} />
              </button>
            )}
            <span className="text-sm text-[var(--color-fg-muted)] truncate">
              {active ? active.title : '—'}
            </span>
          </div>
          <button
            onClick={toggleLock}
            title={editable ? 'Lock' : 'Unlock to edit'}
            className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            {editable ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-8 py-10">
            {active ? (
              <Editor
                key={active.id}
                content={active.content}
                editable={editable}
                onChange={handleChange}
              />
            ) : (
              <div className="text-[var(--color-fg-dim)] italic text-center py-20">
                {editable ? 'Create a note to start writing' : 'No note selected'}
              </div>
            )}
          </div>
        </div>
      </main>

      <LockDialog
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        onUnlock={() => setEditable(true)}
      />
    </div>
  )
}
