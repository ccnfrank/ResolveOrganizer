import { describe, expect, it } from 'vitest'
import { sanitizeName } from './sanitize'

describe('sanitizeName', () => {
  it('replaces forbidden characters and trims', () => {
    expect(sanitizeName('  a/b:c  ')).toBe('a-b-c')
  })

  it('collapses repeated spaces', () => {
    expect(sanitizeName('Client   Campaign')).toBe('Client Campaign')
  })

  it('removes trailing dots', () => {
    expect(sanitizeName('Nome.')).toBe('Nome')
  })

  it('returns empty string when nothing valid remains', () => {
    expect(sanitizeName('...')).toBe('')
    expect(sanitizeName('   ')).toBe('')
  })
})
