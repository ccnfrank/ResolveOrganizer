import { describe, expect, it } from 'vitest'
import { detectLang } from './useLanguage'
import { LANGS, messages, type Messages } from './messages'

describe('detectLang', () => {
  it('maps German browsers to de', () => {
    expect(detectLang('de-DE', null)).toBe('de')
  })

  it('maps Portuguese browsers to pt-BR', () => {
    expect(detectLang('pt-PT', null)).toBe('pt-BR')
  })

  it('falls back to en for unsupported languages', () => {
    expect(detectLang('fr', null)).toBe('en')
  })

  it('prefers a valid stored choice over the browser language', () => {
    expect(detectLang('en', 'pt-BR')).toBe('pt-BR')
  })

  it('ignores an invalid stored value', () => {
    expect(detectLang('de', 'xx')).toBe('de')
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
