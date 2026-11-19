import { Modal } from './Modal'
import type { Messages } from '../i18n/messages'

type ConfirmDialogProps = {
  open: boolean
  message: string
  /** Title of the dialog; defaults to the message, which suits a short question. */
  title?: string
  confirmLabel: string
  tone?: 'danger' | 'accent'
  t: Messages
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  message,
  title,
  confirmLabel,
  tone = 'danger',
  t,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title ?? message} closeLabel={t.close} onClose={onClose}>
      {title && <p className="mb-6 text-sm leading-relaxed text-dim">{message}</p>}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm text-dim transition hover:bg-raised hover:text-fg"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 active:scale-[0.98] ${
            tone === 'danger' ? 'bg-danger' : 'bg-accent'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
