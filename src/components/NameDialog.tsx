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
      <form onSubmit={submit} className="grid gap-5">
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          aria-label={title}
          aria-invalid={error ? true : undefined}
          className="h-12 w-full rounded-xl border border-edge bg-ground px-4 font-mono text-fg outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm text-dim transition hover:bg-raised hover:text-fg"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-105 active:scale-[0.98]"
          >
            {t.save}
          </button>
        </div>
      </form>
    </Modal>
  )
}
