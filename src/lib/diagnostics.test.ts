import { describe, expect, it } from 'vitest'
import { DEFAULT_STRUCTURE, type BinNode } from './binTree'
import { findPrefixConflicts, renumberTopLevel } from './diagnostics'

describe('findPrefixConflicts', () => {
  it('finds the repeated 05_ in the default structure', () => {
    const conflicts = findPrefixConflicts(DEFAULT_STRUCTURE)
    expect(conflicts).toEqual([{ prefix: '05', names: ['05_Exports', '05_Documentos'], topLevel: true }])
  })

  it('reports no conflict when every number is unique', () => {
    const tree: BinNode[] = [{ name: '00_A' }, { name: '01_B' }, { name: 'Loose' }]
    expect(findPrefixConflicts(tree)).toEqual([])
  })

  it('flags repeats inside a bin as not fixable by renumbering', () => {
    const tree: BinNode[] = [{ name: 'X', children: [{ name: '01_a' }, { name: '01_b' }] }]
    expect(findPrefixConflicts(tree)).toEqual([{ prefix: '01', names: ['01_a', '01_b'], topLevel: false }])
  })
})

describe('renumberTopLevel', () => {
  it('renumbers numbered top-level bins in order and keeps their names', () => {
    const names = renumberTopLevel(DEFAULT_STRUCTURE).map((node) => node.name)
    expect(names).toEqual([
      '00_Footage',
      '01_Proxy',
      '02_Audio',
      '03_Assets',
      '04_Imagens',
      '05_Exports',
      '06_Documentos',
      '07_Cache_Proxies',
      '08_Renders',
    ])
  })

  it('leaves unnumbered bins alone and keeps ids and children', () => {
    const tree: BinNode[] = [
      { id: 'a', name: 'Loose', children: [{ name: 'x' }] },
      { id: 'b', name: '09_Last' },
    ]
    const result = renumberTopLevel(tree)
    expect(result[0]).toMatchObject({ id: 'a', name: 'Loose' })
    expect(result[0].children?.[0].name).toBe('x')
    expect(result[1]).toMatchObject({ id: 'b', name: '00_Last' })
  })
})
