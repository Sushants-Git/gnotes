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
  const { password } = (req.body ?? {}) as { password?: string }
  if (password !== pw) {
    res.status(401).json({ ok: false })
    return
  }
  res.status(200).json({ ok: true, token: pw })
}
