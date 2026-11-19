import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, CircleAlert, Info } from 'lucide-react'
import type { Messages } from '../i18n/messages'

export type StatusKind = 'info' | 'success' | 'error'

export type Status = {
  kind: StatusKind
  text: (t: Messages) => string
}

const styles: Record<StatusKind, string> = {
  info: 'border-edge bg-raised text-dim',
  success: 'border-steel/40 bg-raised text-steel',
  error: 'border-danger/45 bg-raised text-danger',
}

const icons: Record<StatusKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: CircleAlert,
}

/** Floating notice that slides up from the bottom edge, announced to screen readers. */
export function StatusMessage({ status, t }: { status: Status | null; t: Messages }) {
  return (
    <div role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {status && (
          <motion.div
            key={`${status.kind}-${status.text(t)}`}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={`flex max-w-[min(92vw,34rem)] items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8)] ${styles[status.kind]}`}
          >
            {(() => {
              const Icon = icons[status.kind]
              return <Icon size={16} aria-hidden="true" className="shrink-0" />
            })()}
            <span className="min-w-0">{status.text(t)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
