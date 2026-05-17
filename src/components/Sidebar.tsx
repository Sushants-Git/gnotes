import { Plus, Trash2, PanelLeftClose } from 'lucide-react'
import type { Note } from '@/lib/storage'
import { cn } from '@/lib/utils'

type Props = {
  notes: Note[]
  activeId: string | null
  editable: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onCollapse: () => void
}

export function Sidebar({ notes, activeId, editable, onSelect, onCreate, onDelete, onCollapse }: Props) {
  return (
    <aside className="h-full flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm tracking-wide text-[var(--color-fg-muted)]">Notes</span>
        <div className="flex items-center gap-1">
          {editable && (
            <button
              onClick={onCreate}
              title="New note"
              className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onCollapse}
            title="Collapse sidebar"
            className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {notes.length === 0 && (
          <div className="px-4 py-6 text-sm text-[var(--color-fg-dim)] italic">
            No notes yet
          </div>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className={cn(
              'group flex items-center justify-between gap-2 px-4 py-2 cursor-pointer text-sm',
              activeId === n.id
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-elevated)]/60',
            )}
            onClick={() => onSelect(n.id)}
          >
            <span className="truncate flex-1">{n.title || 'Untitled'}</span>
            {editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this note?')) onDelete(n.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-bg)] text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-opacity"
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
