import { Languages } from 'lucide-react'
import { LANGS, type Lang, type Messages } from '../i18n/messages'

const LABELS: Record<Lang, { short: string; name: string }> = {
  'pt-BR': { short: 'PT', name: 'Português' },
  en: { short: 'EN', name: 'English' },
  de: { short: 'DE', name: 'Deutsch' },
}

type LanguageSwitchProps = {
  lang: Lang
  t: Messages
  onChange: (lang: Lang) => void
}

export function LanguageSwitch({ lang, t, onChange }: LanguageSwitchProps) {
  return (
    <div
      role="group"
      aria-label={t.language}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-panel p-1"
    >
      <Languages size={15} className="mx-1.5 text-muted" aria-hidden="true" />
      {LANGS.map((code) => {
        const active = code === lang
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={LABELS[code].name}
            onClick={() => onChange(code)}
            className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold tracking-wide transition ${
              active ? 'bg-accent text-ink shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            {LABELS[code].short}
          </button>
        )
      })}
    </div>
  )
}
