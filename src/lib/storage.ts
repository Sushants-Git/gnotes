export type Note = {
  id: string
  title: string
  content: string
  updatedAt: number
  createdAt: number
}

const NOTES_KEY = 'notes:v1'
const SESSION_KEY = 'notes:session'
// Change before deploying. Client-side gate only — anyone with the bundle can read it.
const PASSWORD = 'letmein'

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

export function unlock(password: string): boolean {
  if (password === PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1')
    return true
  }
  return false
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function lock() {
  sessionStorage.removeItem(SESSION_KEY)
}
