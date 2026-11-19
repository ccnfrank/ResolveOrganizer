import type { BinNode } from './binTree'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STRUCTURE } from './binTree'
import { layoutTree, pathKey } from './layout'

const base = { nodeWidth: 180, nodeHeight: 50, gapY: 10, step: 56 }

describe('layoutTree', () => {
  it('places the project root and every bin of the default structure', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    expect(layout.items).toHaveLength(14)
    expect(layout.items[0]).toMatchObject({ key: 'root', path: null, depth: 0, x: 0, y: 0 })
    expect(layout.edges).toHaveLength(13)
  })

  it('puts each depth in its own column in graph mode', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    const audio = layout.items.find((item) => item.key === pathKey([2]))!
    const vo = layout.items.find((item) => item.key === pathKey([2, 0]))!
    expect(audio.x).toBe(base.nodeWidth + base.step)
    expect(vo.x).toBe(2 * (base.nodeWidth + base.step))
  })

  it('stacks rows in depth-first order with a constant stride', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    const stride = base.nodeHeight + base.gapY
    layout.items.forEach((item, index) => {
      expect(item.order).toBe(index)
      expect(item.y).toBe(index * stride)
    })
    // 02_Audio is followed by its three children before 03_Assets
    const keys = layout.items.map((item) => item.key)
    expect(keys.indexOf('2.2')).toBe(keys.indexOf('2') + 3)
  })

  it('indents by one step per level in list mode', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'list' })
    const vo = layout.items.find((item) => item.key === pathKey([2, 0]))!
    expect(vo.x).toBe(2 * base.step)
  })

  it('draws bezier curves in graph mode and elbow rails in list mode', () => {
    const graph = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    const list = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'list' })
    expect(graph.edges[0].d).toMatch(/^M.* C/)
    expect(list.edges[0].d).toMatch(/^M.* V.* H/)
  })

  it('reports the total size so the canvas can fit it', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    const deepest = layout.items.reduce((max, item) => Math.max(max, item.x + item.width), 0)
    expect(layout.width).toBe(deepest)
    expect(layout.height).toBe(layout.items.at(-1)!.y + base.nodeHeight)
  })
})

describe('layoutTree manual positions', () => {
  it('places a dragged bin at its stored position and keeps the automatic one', () => {
    const id = 'bin-manual'
    const tree: BinNode[] = [{ id, name: 'Dragged' }]
    const layout = layoutTree('Demo', tree, { ...base, mode: 'graph', positions: { [id]: { x: 500, y: 90 } } })
    const item = layout.items.find((entry) => entry.id === id)!
    expect(item).toMatchObject({ x: 500, y: 90 })
    expect(item.autoX).toBe(base.nodeWidth + base.step)
    expect(layout.width).toBeGreaterThanOrEqual(500 + base.nodeWidth)
  })

  it('ignores manual positions in list mode', () => {
    const id = 'bin-manual'
    const tree: BinNode[] = [{ id, name: 'Dragged' }]
    const layout = layoutTree('Demo', tree, { ...base, mode: 'list', positions: { [id]: { x: 500, y: 90 } } })
    expect(layout.items.find((entry) => entry.id === id)!.x).toBe(base.step)
  })
})
