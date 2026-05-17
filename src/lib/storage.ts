export type Note = {
  id: string
  title: string
  content: string
  updatedAt: number
  createdAt: number
}

const NOTES_KEY = 'notes:v1'
const DELETED_KEY = 'notes:deleted:v1'
const TOKEN_KEY = 'notes:token'

export function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Note[]
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export function loadDeleted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function saveDeleted(ids: string[]) {
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids))
}

export function newNote(): Note {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: 'Untitled',
    content: '',
    updatedAt: now,
    createdAt: now,
  }
}

export function isUnlocked(): boolean {
  return localStorage.getItem(TOKEN_KEY) != null
}

export function lock() {
  localStorage.removeItem(TOKEN_KEY)
}

// Merge: per-id newer updatedAt wins. Returns merged sorted list.
export function mergeNotes(a: Note[], b: Note[]): Note[] {
  const map = new Map<string, Note>()
  for (const n of a) map.set(n.id, n)
  for (const n of b) {
    const existing = map.get(n.id)
    if (!existing || n.updatedAt > existing.updatedAt) map.set(n.id, n)
  }
  return Array.from(map.values()).sort((x, y) => y.updatedAt - x.updatedAt)
}
