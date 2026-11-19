import { motion } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1] as const

/** Three bin rows build in order while a playhead runs across them, then the title is revealed. */
const ROWS = [
  { width: 64, indent: 0, color: 'var(--color-accent)', delay: 0.05 },
  { width: 88, indent: 16, color: 'var(--color-fg)', delay: 0.2 },
  { width: 44, indent: 32, color: 'var(--color-steel)', delay: 0.35 },
  { width: 72, indent: 16, color: 'var(--color-dim)', delay: 0.5 },
]

export function Splash({ title, caption }: { title: string; caption: string }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-ground"
      exit={{ opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
    >
      <div className="grid w-80 gap-8">
        <div className="relative grid gap-3 rounded-2xl border border-edge bg-surface p-6">
          {ROWS.map((row) => (
            <motion.div
              key={row.color}
              className="h-3.5 rounded-[4px]"
              style={{ width: `${row.width}%`, marginLeft: row.indent, background: row.color }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: row.delay, duration: 0.55, ease: EASE }}
            />
          ))}
          <motion.span
            className="absolute inset-y-4 w-px bg-danger shadow-[0_0_12px_var(--color-danger)]"
            initial={{ left: '6%', opacity: 0 }}
            animate={{ left: ['6%', '94%'], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.25, ease: 'easeInOut', times: [0, 0.2, 0.9, 1] }}
          />
        </div>

        <div className="grid gap-2">
          <motion.p
            className="whitespace-nowrap text-4xl font-semibold tracking-tight text-fg"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
          >
            {title}
          </motion.p>
          <p className="text-sm text-dim">{caption}</p>
        </div>
      </div>
    </motion.div>
  )
}
