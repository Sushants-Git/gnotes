import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
const PASSWORD = process.env.NOTES_PASSWORD
const PORT = Number(process.env.PORT ?? 3001)

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}
if (!PASSWORD) {
  console.error('Missing NOTES_PASSWORD')
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { prepare: false })

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
console.log('db ready')

type Note = {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
}

function isAuthed(req: Request): boolean {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return false
  return auth.slice('Bearer '.length) === PASSWORD
}

async function fetchAll(): Promise<Note[]> {
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

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const { pathname } = url

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'access-control-allow-headers': 'content-type, authorization',
        },
      })
    }

    try {
      if (pathname === '/api/auth' && req.method === 'POST') {
        const { password } = (await req.json()) as { password?: string }
        if (password !== PASSWORD) return json({ ok: false }, { status: 401 })
        return json({ ok: true, token: PASSWORD })
      }

      if (pathname === '/api/notes' && req.method === 'GET') {
        return json({ notes: await fetchAll() })
      }

      if (pathname === '/api/sync' && req.method === 'POST') {
        if (!isAuthed(req)) return json({ ok: false }, { status: 401 })
        const body = (await req.json()) as { notes: Note[]; deletedIds?: string[] }
        const incoming = body.notes ?? []
        const deletedIds = body.deletedIds ?? []

        if (incoming.length > 0) {
          await sql.begin(async (tx) => {
            for (const n of incoming) {
              await tx`
                INSERT INTO notes (id, title, content, created_at, updated_at)
                VALUES (${n.id}, ${n.title}, ${n.content}, ${n.createdAt}, ${n.updatedAt})
                ON CONFLICT (id) DO UPDATE
                  SET title = EXCLUDED.title,
                      content = EXCLUDED.content,
                      updated_at = EXCLUDED.updated_at
                  WHERE notes.updated_at < EXCLUDED.updated_at
              `
            }
          })
        }

        if (deletedIds.length > 0) {
          const now = Date.now()
          await sql`
            UPDATE notes SET deleted_at = ${now}
            WHERE id = ANY(${deletedIds}) AND deleted_at IS NULL
          `
        }

        return json({ notes: await fetchAll() })
      }

      return new Response('not found', { status: 404 })
    } catch (err) {
      console.error(err)
      return json({ error: String(err) }, { status: 500 })
    }
  },
})

console.log(`api on http://localhost:${server.port}`)
