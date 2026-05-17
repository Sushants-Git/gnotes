import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, fetchAll, isAuthed, getSql, type Note } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  if (!isAuthed(req)) {
    res.status(401).json({ ok: false })
    return
  }
  try {
    await ensureSchema()
    const sql = getSql()
    const raw = req.body
    const body = (typeof raw === 'string' ? JSON.parse(raw) : raw ?? {}) as {
      notes?: Note[]; deletedIds?: string[]
    }
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

    const notes = await fetchAll()
    res.status(200).json({ notes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
