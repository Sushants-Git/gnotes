import { useState, useEffect, useRef, type FormEvent } from 'react'
import { apiAuth, setToken } from '@/lib/api'

type Props = {
  open: boolean
  onClose: () => void
  onUnlock: () => void
}

export function LockDialog({ open, onClose, onUnlock }: Props) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [pending, setPending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setPw('')
      setErr(false)
      setPending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setPending(true)
    const token = await apiAuth(pw)
    setPending(false)
    if (token) {
      setToken(token)
      onUnlock()
      onClose()
    } else {
      setErr(true)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm anim-fade"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg p-5 w-[320px] shadow-xl anim-dialog"
      >
        <div className="text-sm text-[var(--color-fg-muted)] mb-3">Enter password</div>
        <input
          ref={inputRef}
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false) }}
          disabled={pending}
          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-3 py-2 outline-none focus:border-[var(--color-fg-dim)] text-[var(--color-fg)] disabled:opacity-60"
        />
        {err && <div className="text-xs text-red-400/80 mt-2">Wrong password</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1.5 text-sm bg-[var(--color-fg)] text-[var(--color-bg)] rounded hover:opacity-90 disabled:opacity-60"
          >
            {pending ? '…' : 'Unlock'}
          </button>
        </div>
      </form>
    </div>
  )
}
