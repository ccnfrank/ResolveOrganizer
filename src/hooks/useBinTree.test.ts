import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useBinTree } from './useBinTree'
import { countFolders, DEFAULT_STRUCTURE, type BinNode } from '../lib/binTree'

const names = (nodes: BinNode[]) => nodes.map((node) => node.name)

describe('useBinTree history', () => {
  it('undoes and redoes a removal', () => {
    const { result } = renderHook(() => useBinTree())
    act(() => result.current.select([0]))
    act(() => result.current.remove())
    expect(countFolders(result.current.nodes)).toBe(12)

    act(() => result.current.undo())
    expect(countFolders(result.current.nodes)).toBe(13)
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.redo())
    expect(countFolders(result.current.nodes)).toBe(12)
  })

  it('clears the redo branch after a new edit', () => {
    const { result } = renderHook(() => useBinTree())
    act(() => result.current.rename('Renamed'))
    act(() => result.current.undo())
    act(() => result.current.reset())
    expect(result.current.canRedo).toBe(false)
  })

  it('drops the selection when undo removes the selected bin', () => {
    const { result } = renderHook(() => useBinTree())
    act(() => result.current.addSibling('Temp'))
    expect(result.current.selected).toEqual([9])
    act(() => result.current.undo())
    expect(result.current.selected).toBeNull()
  })
})

describe('useBinTree positions', () => {
  it('stores a dragged position against the bin id and undoes it', () => {
    const { result } = renderHook(() => useBinTree())
    const id = result.current.nodes[0].id!
    act(() => result.current.setPosition(id, { x: 300, y: 40 }))
    expect(result.current.positions[id]).toEqual({ x: 300, y: 40 })

    act(() => result.current.undo())
    expect(result.current.positions[id]).toBeUndefined()
  })

  it('keeps a bin position when the bin is renamed', () => {
    const { result } = renderHook(() => useBinTree())
    const id = result.current.nodes[1].id!
    act(() => result.current.select([1]))
    act(() => result.current.setPosition(id, { x: 10, y: 20 }))
    act(() => result.current.rename('Renamed'))
    expect(result.current.positions[id]).toEqual({ x: 10, y: 20 })
  })

  it('forgets positions of bins that were removed', () => {
    const { result } = renderHook(() => useBinTree())
    const id = result.current.nodes[1].id!
    act(() => result.current.setPosition(id, { x: 10, y: 20 }))
    act(() => result.current.select([1]))
    act(() => result.current.remove())
    expect(result.current.positions[id]).toBeUndefined()
  })
})

describe('useBinTree presets and renumbering', () => {
  it('applies a whole structure and resets positions', () => {
    const { result } = renderHook(() => useBinTree())
    act(() => result.current.setPosition(result.current.nodes[0].id!, { x: 1, y: 1 }))
    act(() => result.current.applyTree([{ name: 'Only' }]))
    expect(names(result.current.nodes)).toEqual(['Only'])
    expect(result.current.positions).toEqual({})
  })

  it('renumbers the default structure and can be undone', () => {
    const { result } = renderHook(() => useBinTree())
    act(() => result.current.renumber())
    expect(result.current.nodes[6].name).toBe('06_Documentos')
    act(() => result.current.undo())
    expect(result.current.nodes[6].name).toBe(DEFAULT_STRUCTURE[6].name)
  })
})
