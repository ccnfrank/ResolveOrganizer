import { motion } from 'motion/react'
import type { Lang, Messages } from '../i18n/messages'

const OPTIONS: { value: Lang; short: string; name: string }[] = [
  { value: 'pt-BR', short: 'PT', name: 'Português' },
  { value: 'en', short: 'EN', name: 'English' },
  { value: 'de', short: 'DE', name: 'Deutsch' },
]

/** Segmented switch; the amber pill slides between languages. */
export function LanguageSwitch({ lang, t, onChange }: { lang: Lang; t: Messages; onChange: (lang: Lang) => void }) {
  return (
    <div role="group" aria-label={t.language} className="inline-flex rounded-full border border-edge bg-surface p-1 font-mono text-xs">
      {OPTIONS.map((option) => {
        const active = option.value === lang
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.name}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`relative rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
              active ? 'text-ink' : 'text-dim hover:text-fg'
            }`}
          >
            {active && (
              <motion.span
                layoutId="language-pill"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
            <span className="relative">{option.short}</span>
          </button>
        )
      })}
    </div>
  )
}
