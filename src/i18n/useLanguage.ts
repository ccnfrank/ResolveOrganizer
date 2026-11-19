import { useCallback, useEffect, useState } from 'react'
import { LANGS, messages, type Lang, type Messages } from './messages'

const STORAGE_KEY = 'resolve-organizer-lang'

function isLang(value: string | null): value is Lang {
  return value !== null && (LANGS as string[]).includes(value)
}

/** Stored choice wins if valid; otherwise map the browser language; otherwise English. */
export function detectLang(navigatorLang: string, stored: string | null): Lang {
  if (isLang(stored)) return stored
  const base = navigatorLang.toLowerCase()
  if (base.startsWith('pt')) return 'pt-BR'
  if (base.startsWith('de')) return 'de'
  return 'en'
}

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Storage may be blocked; the choice then lasts for this session only.
  }
}

export function useLanguage(): { lang: Lang; setLang: (lang: Lang) => void; t: Messages } {
  const [lang, setLangState] = useState<Lang>(() =>
    detectLang(typeof navigator !== 'undefined' ? navigator.language : 'en', readStored()),
  )

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    writeStored(next)
  }, [])

  return { lang, setLang, t: messages[lang] }
}
