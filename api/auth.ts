import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  const pw = process.env.NOTES_PASSWORD
  if (!pw) {
    res.status(500).json({ error: 'NOTES_PASSWORD not configured' })
    return
  }
  const raw = req.body
  const body = (typeof raw === 'string' ? JSON.parse(raw) : raw ?? {}) as { password?: string }
  if (body.password !== pw) {
    res.status(401).json({ ok: false })
    return
  }
  res.status(200).json({ ok: true, token: pw })
}
