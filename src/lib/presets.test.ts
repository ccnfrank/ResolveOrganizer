import { describe, expect, it } from 'vitest'
import { BUILTIN_PRESETS, MAX_PRESET_BINS, parsePreset, serializePreset } from './presets'
import { countFolders, type BinNode } from './binTree'
import { findPrefixConflicts } from './diagnostics'

describe('built-in presets', () => {
  it('new models never repeat a number at the top level', () => {
    // The default structure keeps its original repeated 05_; the alert tells the user about it.
    for (const preset of BUILTIN_PRESETS.filter((item) => item.id !== 'default')) {
      expect(findPrefixConflicts(preset.nodes), preset.id).toEqual([])
    }
  })
})

describe('serializePreset and parsePreset', () => {
  it('round-trips a tree without ids', () => {
    const tree: BinNode[] = [{ id: 'x', name: 'A', children: [{ id: 'y', name: 'B' }] }]
    const text = serializePreset('Demo', tree)
    const parsed = parsePreset(text)
    expect(parsed).toEqual({
      ok: true,
      name: 'Demo',
      nodes: [{ id: expect.any(String), name: 'A', children: [{ id: expect.any(String), name: 'B' }] }],
    })
    expect(text).not.toContain('"id"')
  })

  it('rejects text that is not JSON', () => {
    expect(parsePreset('not json')).toEqual({ ok: false, reason: 'invalid' })
  })

  it('rejects a file that is not a Resolve Organizer preset', () => {
    expect(parsePreset(JSON.stringify({ bins: [] }))).toEqual({ ok: false, reason: 'invalid' })
  })

  it('rejects a bin without a usable name', () => {
    const text = JSON.stringify({ format: 'resolve-organizer-preset', version: 1, name: 'x', bins: [{ name: '  ..  ' }] })
    expect(parsePreset(text)).toEqual({ ok: false, reason: 'invalid' })
  })

  it('sanitizes names coming from a file', () => {
    const text = JSON.stringify({ format: 'resolve-organizer-preset', version: 1, name: 'x', bins: [{ name: 'a/b:c' }] })
    const parsed = parsePreset(text)
    expect(parsed.ok && parsed.nodes[0].name).toBe('a-b-c')
  })

  it('refuses a preset with more bins than the limit', () => {
    const bins = Array.from({ length: MAX_PRESET_BINS + 1 }, (_, i) => ({ name: `b${i}` }))
    const text = JSON.stringify({ format: 'resolve-organizer-preset', version: 1, name: 'big', bins })
    expect(parsePreset(text)).toEqual({ ok: false, reason: 'tooLarge' })
    expect(countFolders(bins)).toBe(MAX_PRESET_BINS + 1)
  })
})
