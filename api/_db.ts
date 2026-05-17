import postgres from 'postgres'

type Sql = ReturnType<typeof postgres>

const g = globalThis as unknown as { __sql?: Sql }

export function getSql(): Sql {
  if (g.__sql) return g.__sql
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
  if (!url) throw new Error('Missing DATABASE_URL or POSTGRES_URL')
  g.__sql = postgres(url, { prepare: false, max: 1 })
  return g.__sql
}

let initPromise: Promise<void> | null = null
export function ensureSchema(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSql()
      await sql`
        CREATE TABLE IF NOT EXISTS notes (
          id          text   PRIMARY KEY,
          title       text   NOT NULL DEFAULT 'Untitled',
          content     text   NOT NULL DEFAULT '',
          created_at  bigint NOT NULL,
          updated_at  bigint NOT NULL,
          deleted_at  bigint
        )
      `
    })().catch((e) => { initPromise = null; throw e })
  }
  return initPromise
}

export type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export async function fetchAll(): Promise<Note[]> {
  const sql = getSql()
  const rows = await sql<{
    id: string; title: string; content: string;
    created_at: string | number; updated_at: string | number;
  }[]>`
    SELECT id, title, content, created_at, updated_at
    FROM notes
    WHERE deleted_at IS NULL
    ORDER BY updated_at DESC
  `
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  }))
}

export function isAuthed(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const pw = process.env.NOTES_PASSWORD
  if (!pw) return false
  const raw = req.headers['authorization']
  const auth = Array.isArray(raw) ? raw[0] : raw
  if (!auth?.startsWith('Bearer ')) return false
  return auth.slice('Bearer '.length) === pw
}
