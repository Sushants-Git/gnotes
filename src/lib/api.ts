import type { Note } from './storage'

const TOKEN_KEY = 'notes:token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiAuth(password: string): Promise<string | null> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { token: string }
  return data.token
}

export async function apiFetchNotes(): Promise<Note[]> {
  const res = await fetch('/api/notes')
  if (!res.ok) throw new Error('fetch failed')
  const data = (await res.json()) as { notes: Note[] }
  return data.notes
}

export async function apiSync(notes: Note[], deletedIds: string[]): Promise<Note[] | null> {
  const token = getToken()
  if (!token) return null
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes, deletedIds }),
  })
  if (res.status === 401) {
    clearToken()
    return null
  }
  if (!res.ok) return null
  const data = (await res.json()) as { notes: Note[] }
  return data.notes
}
