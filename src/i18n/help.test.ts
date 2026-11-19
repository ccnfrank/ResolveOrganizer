import { describe, expect, it } from 'vitest'
import { HELP } from './help'
import { LANGS } from './messages'

describe('help guide', () => {
  it('has the same sections, in the same order, in every language', () => {
    const headings = (lang: (typeof LANGS)[number]) => HELP[lang].sections.map((section) => section.heading)
    for (const lang of LANGS) {
      expect(headings(lang)).toHaveLength(HELP.en.sections.length)
      expect(HELP[lang].sections.map((section) => section.shortcuts?.length ?? 0)).toEqual(
        HELP.en.sections.map((section) => section.shortcuts?.length ?? 0),
      )
    }
  })

  it('lists every shortcut with a key and an action', () => {
    for (const lang of LANGS) {
      const shortcuts = HELP[lang].sections.flatMap((section) => section.shortcuts ?? [])
      expect(shortcuts.length).toBeGreaterThan(10)
      for (const [keys, action] of shortcuts) {
        expect(keys.trim()).not.toBe('')
        expect(action.trim()).not.toBe('')
      }
    }
  })
})
