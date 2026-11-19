import { describe, expect, it } from 'vitest'
import { detectLang } from './useLanguage'
import { LANGS, messages, type Messages } from './messages'

describe('detectLang', () => {
  it('defaults to English when nothing was chosen', () => {
    expect(detectLang(null)).toBe('en')
  })

  it('keeps a valid stored choice', () => {
    expect(detectLang('pt-BR')).toBe('pt-BR')
    expect(detectLang('de')).toBe('de')
  })

  it('falls back to English for an invalid stored value', () => {
    expect(detectLang('xx')).toBe('en')
  })
})

describe('messages', () => {
  it('has the same keys in every language', () => {
    const keys = (dict: Messages) => Object.keys(dict).sort()
    const reference = keys(messages.en)
    for (const lang of LANGS) {
      expect(keys(messages[lang])).toEqual(reference)
    }
  })
})
