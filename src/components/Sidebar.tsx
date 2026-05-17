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
      <div className="flex items-center justify-end gap-1 px-2 pt-2">
        {editable && (
          <button
            onClick={onCreate}
            title="New note"
            className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors duration-150 ease active:scale-95"
          >
            <Plus size={15} />
          </button>
        )}
        <button
          onClick={onCollapse}
          title="Collapse sidebar"
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors duration-150 ease active:scale-95"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {notes.length === 0 && (
          <div className="px-3 py-6 text-sm text-[var(--color-fg-dim)] italic">
            No notes yet
          </div>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className={cn(
              'group flex items-center justify-between gap-2 px-3 py-1.5 mb-0.5 cursor-pointer text-sm rounded-[8px]',
              'transition-colors duration-150 ease-in-out',
              activeId === n.id
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-elevated)]/50',
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
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-opacity duration-150 ease"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
