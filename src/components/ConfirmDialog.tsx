import { Modal } from './Modal'
import type { Messages } from '../i18n/messages'

type ConfirmDialogProps = {
  open: boolean
  message: string
  t: Messages
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, message, t, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={message} closeLabel={t.close} onClose={onClose}>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-text"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-danger/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-danger"
        >
          {t.removeAction}
        </button>
      </div>
    </Modal>
  )
}
