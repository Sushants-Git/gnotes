import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { Lock, Unlock, PanelLeft } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Editor } from '@/components/Editor'
import { LockDialog } from '@/components/LockDialog'
import {
  loadNotes,
  saveNotes,
  loadDeleted,
  saveDeleted,
  mergeNotes,
  newNote,
  isUnlocked,
  lock,
  type Note,
} from '@/lib/storage'
import { apiFetchNotes, apiSync, clearToken } from '@/lib/api'

function extractTitle(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 'Untitled'
  return text.slice(0, 60)
}

const MemoSidebar = memo(Sidebar)

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editable, setEditable] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('notes:sidebar') === 'collapsed')

  const pending = useRef<{ id: string; html: string } | null>(null)
  const flushTimer = useRef<number | null>(null)
  const syncTimer = useRef<number | null>(null)
  const notesRef = useRef<Note[]>([])
  const deletedRef = useRef<string[]>([])
  const activeIdRef = useRef<string | null>(null)
  notesRef.current = notes
  activeIdRef.current = activeId

  useEffect(() => {
    localStorage.setItem('notes:sidebar', collapsed ? 'collapsed' : 'open')
  }, [collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const scheduleSync = useCallback(() => {
    if (syncTimer.current) window.clearTimeout(syncTimer.current)
    syncTimer.current = window.setTimeout(async () => {
      const local = notesRef.current
      const deleted = deletedRef.current
      const merged = await apiSync(local, deleted)
      if (merged) {
        const next = mergeNotes(local, merged)
        // Drop locally-deleted ids from the merged result.
        const filtered = next.filter((n) => !deleted.includes(n.id))
        setNotes(filtered)
        saveNotes(filtered)
        deletedRef.current = []
        saveDeleted([])
      }
    }, 800)
  }, [])

  // Initial load: local first, then merge with server (read is public).
  useEffect(() => {
    const local = loadNotes()
    deletedRef.current = loadDeleted()
    setNotes(local)
    if (local.length > 0) setActiveId(local[0].id)
    setEditable(isUnlocked())

    apiFetchNotes()
      .then((remote) => {
        const merged = mergeNotes(local, remote).filter(
          (n) => !deletedRef.current.includes(n.id),
        )
        setNotes(merged)
        saveNotes(merged)
        if (!activeIdRef.current && merged.length > 0) setActiveId(merged[0].id)
        // If we have a token, push any local-only changes immediately.
        if (isUnlocked()) scheduleSync()
      })
      .catch(() => { /* offline; keep local */ })
  }, [scheduleSync])

  const flush = useCallback(() => {
    const p = pending.current
    if (!p) return
    pending.current = null
    if (flushTimer.current) { window.clearTimeout(flushTimer.current); flushTimer.current = null }
    const next = notesRef.current.map((n) =>
      n.id === p.id
        ? { ...n, content: p.html, title: extractTitle(p.html), updatedAt: Date.now() }
        : n,
    )
    setNotes(next)
    saveNotes(next)
    scheduleSync()
  }, [scheduleSync])

  useEffect(() => {
    const handler = () => flush()
    window.addEventListener('beforeunload', handler)
    document.addEventListener('visibilitychange', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      document.removeEventListener('visibilitychange', handler)
    }
  }, [flush])

  const handleChange = useCallback((html: string) => {
    const id = activeIdRef.current
    if (!id) return
    pending.current = { id, html }
    if (flushTimer.current) window.clearTimeout(flushTimer.current)
    flushTimer.current = window.setTimeout(flush, 500)
  }, [flush])

  const active = notes.find((n) => n.id === activeId) ?? null

  const handleCreate = useCallback(() => {
    flush()
    const n = newNote()
    const next = [n, ...notesRef.current]
    setNotes(next)
    setActiveId(n.id)
    saveNotes(next)
    scheduleSync()
  }, [flush, scheduleSync])

  const handleDelete = useCallback((id: string) => {
    if (pending.current?.id === id) pending.current = null
    const next = notesRef.current.filter((n) => n.id !== id)
    setNotes(next)
    setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur))
    saveNotes(next)
    deletedRef.current = Array.from(new Set([...deletedRef.current, id]))
    saveDeleted(deletedRef.current)
    scheduleSync()
  }, [scheduleSync])

  const handleSelect = useCallback((id: string) => {
    flush()
    setActiveId(id)
  }, [flush])

  const handleCollapse = useCallback(() => setCollapsed(true), [])

  const handleUnlock = useCallback(() => {
    setEditable(true)
    scheduleSync()
  }, [scheduleSync])

  const toggleLock = () => {
    if (editable) {
      lock()
      clearToken()
      setEditable(false)
    } else {
      setLockOpen(true)
    }
  }

  return (
    <div className="h-full w-full flex bg-[var(--color-bg)]">
      {!collapsed && (
        <div className="h-full shrink-0" style={{ width: 240 }}>
          <MemoSidebar
            notes={notes}
            activeId={activeId}
            editable={editable}
            onSelect={handleSelect}
            onCreate={handleCreate}
            onDelete={handleDelete}
            onCollapse={handleCollapse}
          />
        </div>
      )}

      <main className="flex-1 h-full flex flex-col relative min-w-0">
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute top-2 left-2 z-10 p-1.5 rounded text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-elevated)] transition-colors duration-150 ease"
            title="Show sidebar (⌘B)"
          >
            <PanelLeft size={15} />
          </button>
        )}
        <button
          onClick={toggleLock}
          title={editable ? 'Lock' : 'Unlock to edit'}
          className="absolute top-2 right-2 z-10 p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors duration-150 ease active:scale-95"
        >
          {editable ? <Unlock size={15} /> : <Lock size={15} />}
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-8 pb-10" style={{ paddingTop: 230 }}>
            {active ? (
              <div key={active.id} className="anim-fade">
                <Editor
                  initialContent={active.content}
                  editable={editable}
                  onChange={handleChange}
                />
              </div>
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
        onUnlock={handleUnlock}
      />
    </div>
  )
}
