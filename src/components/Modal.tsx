import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
  /** A wider panel for long content such as the help guide. */
  wide?: boolean
}

/** Accessible dialog shell: closes on Escape and on backdrop click. */
export function Modal({ open, title, closeLabel, onClose, children, wide = false }: ModalProps) {
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
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
            className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-edge bg-surface p-6 shadow-[0_28px_70px_-18px_rgb(0_0_0/0.75)]`}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-xl text-fg">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="rounded-lg p-1.5 text-dim transition duration-200 hover:bg-raised hover:text-fg"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
