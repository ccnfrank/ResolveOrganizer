import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}

/** Accessible dialog shell: closes on Escape and on backdrop click. */
export function Modal({ open, title, closeLabel, onClose, children }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-lg border border-white/10 bg-panel p-6 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 id={titleId} className="font-display text-lg font-semibold text-text">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="rounded-lg p-1 text-muted transition hover:bg-white/[0.06] hover:text-text"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
