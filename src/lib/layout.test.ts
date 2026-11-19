import type { BinNode } from './binTree'
import { describe, expect, it } from 'vitest'
import { DEFAULT_STRUCTURE } from './binTree'
import { layoutTree, pathKey } from './layout'

const base = { nodeWidth: 180, nodeHeight: 50, gapY: 10, step: 56 }

describe('layoutTree', () => {
  it('places the project root and every bin of the default structure', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    expect(layout.items).toHaveLength(14)
    expect(layout.items[0]).toMatchObject({ key: 'root', path: null, depth: 0, x: 0 })
    expect(layout.edges).toHaveLength(13)
  })

  it('starts the project root level with the middle of the bins', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    const bins = layout.items.slice(1)
    const top = bins[0].y
    const bottom = bins.at(-1)!.y + base.nodeHeight
    expect(layout.items[0].y).toBe((top + bottom - base.nodeHeight) / 2)
  })

  it('grows the project root to show its name and moves the columns right', () => {
    const short = layoutTree('Demo', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    const long = layoutTree('Client Campaign Final Cut', DEFAULT_STRUCTURE, { ...base, mode: 'graph' })
    expect(long.items[0].width).toBeGreaterThan(base.nodeWidth)
    const rootRight = long.items[0].x + long.items[0].width
    const audio = long.items.find((item) => item.key === pathKey([2]))!
    expect(audio.x).toBeGreaterThanOrEqual(rootRight + base.step)
    expect(short.items[0].width).toBe(base.nodeWidth)
  })

  it('keeps a dragged project root where it was dropped', () => {
    const layout = layoutTree('Demo', DEFAULT_STRUCTURE, {
      ...base,
      mode: 'graph',
      positions: { root: { x: 40, y: 10 } },
    })
    expect(layout.items[0]).toMatchObject({ x: 40, y: 10 })
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
      // The project root is centred on the bins, so only the bins follow the stride
      if (index > 0) expect(item.y).toBe(index * stride)
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

describe('layoutTree loose bins', () => {
  const withLoose: BinNode[] = [{ name: 'A' }, { name: 'Solto', loose: true }]

  it('draws no connector to a loose bin', () => {
    const layout = layoutTree('Demo', withLoose, { ...base, mode: 'graph' })
    const loose = layout.items.find((item) => item.name === 'Solto')!
    expect(loose.loose).toBe(true)
    expect(layout.edges.some((edge) => edge.to === loose.key)).toBe(false)
    expect(layout.edges.some((edge) => edge.to === pathKey([0]))).toBe(true)
  })

  it('places loose bins in a lane to the right of the connected tree', () => {
    const layout = layoutTree('Demo', withLoose, { ...base, mode: 'graph' })
    const connected = layout.items.filter((item) => !item.loose)
    const treeRight = Math.max(...connected.map((item) => item.x + item.width))
    const loose = layout.items.find((item) => item.name === 'Solto')!
    expect(loose.x).toBeGreaterThan(treeRight)
  })
})
