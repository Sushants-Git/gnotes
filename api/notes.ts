import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ensureSchema, fetchAll } from './_db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  try {
    await ensureSchema()
    const notes = await fetchAll()
    res.status(200).json({ notes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
