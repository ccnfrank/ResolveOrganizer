import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, CircleAlert, Info } from 'lucide-react'
import type { Messages } from '../i18n/messages'

export type StatusKind = 'info' | 'success' | 'error'

export type Status = {
  kind: StatusKind
  text: (t: Messages) => string
}

const styles: Record<StatusKind, string> = {
  info: 'border-line bg-bg text-muted',
  success: 'border-success/30 bg-success/5 text-success',
  error: 'border-danger/40 bg-danger/5 text-danger',
}

const icons: Record<StatusKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: CircleAlert,
}

export function StatusMessage({ status, t }: { status: Status | null; t: Messages }) {
  return (
    <div role="status" aria-live="polite" className="min-h-[2.75rem]">
      <AnimatePresence mode="wait">
        {status && (
          <motion.div
            key={`${status.kind}-${status.text(t)}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs ${styles[status.kind]}`}
          >
            {(() => {
              const Icon = icons[status.kind]
              return <Icon size={16} aria-hidden="true" className="shrink-0" />
            })()}
            <span>{status.text(t)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
