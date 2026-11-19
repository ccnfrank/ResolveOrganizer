import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import { sanitizeName } from '../lib/sanitize'
import type { Messages } from '../i18n/messages'

type NameDialogProps = {
  open: boolean
  title: string
  initialValue: string
  t: Messages
  onSubmit: (name: string) => void
  onClose: () => void
}

export function NameDialog({ open, title, initialValue, t, onSubmit, onClose }: NameDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
      setError(null)
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }, [open, initialValue])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const cleaned = sanitizeName(value)
    if (!cleaned) {
      setError(t.nameEmpty)
      return
    }
    onSubmit(cleaned)
  }

  return (
    <Modal open={open} title={title} closeLabel={t.close} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          aria-label={title}
          aria-invalid={error ? true : undefined}
          className="w-full rounded-md border border-line bg-bg px-4 py-3 font-mono text-text outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/20"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-text"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
          >
            {t.save}
          </button>
        </div>
      </form>
    </Modal>
  )
}
