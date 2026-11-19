import type { Ref } from 'react'
import { motion } from 'motion/react'
import { Clapperboard, LoaderCircle } from 'lucide-react'

type RenderButtonProps = {
  label: string
  busyLabel: string
  progressLabel: string
  /** 0..1, drawn as a fill behind the label while rendering. */
  progress: number
  busy: boolean
  disabled: boolean
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
}

/** Primary action. While rendering it becomes a progress bar that fills folder by folder. */
export function RenderButton({
  label,
  busyLabel,
  progressLabel,
  progress,
  busy,
  disabled,
  onClick,
  buttonRef,
}: RenderButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-accent font-semibold text-ink transition duration-200 hover:brightness-105 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-ink/15"
        initial={false}
        animate={{ width: `${Math.round(progress * 100)}%` }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      <span className="relative flex items-center gap-2.5">
        {busy ? (
          <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
        ) : (
          <Clapperboard
            size={18}
            aria-hidden="true"
            className="transition duration-300 group-hover:-rotate-6 group-hover:scale-110"
          />
        )}
        {busy ? (
          <span>
            {busyLabel} <span className="font-mono num text-sm opacity-75">{progressLabel}</span>
          </span>
        ) : (
          <span>{label}</span>
        )}
      </span>
    </button>
  )
}
