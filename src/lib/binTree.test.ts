import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STRUCTURE,
  addLoose,
  canReparent,
  connectedNodes,
  cloneTree,
  countFolders,
  findPath,
  getNode,
  insertChild,
  insertSibling,
  moveNode,
  removeNode,
  renameNode,
  reparentNode,
  type BinNode,
} from './binTree'

const sample = (): BinNode[] => [
  { name: 'A' },
  { name: 'B', children: [{ name: 'B1' }, { name: 'B2' }] },
]

describe('binTree', () => {
  it('counts the default structure as 13 folders', () => {
    expect(countFolders(DEFAULT_STRUCTURE)).toBe(13)
  })

  it('inserts a sibling after the selected node', () => {
    const { nodes, path } = insertSibling(sample(), [0], 'New')
    expect(nodes.map((n) => n.name)).toEqual(['A', 'New', 'B'])
    expect(path).toEqual([1])
  })

  it('inserts a child at the end of the selected node', () => {
    const { nodes, path } = insertChild(sample(), [1], 'B3')
    expect(nodes[1].children?.map((n) => n.name)).toEqual(['B1', 'B2', 'B3'])
    expect(path).toEqual([1, 2])
  })

  it('renames a node', () => {
    const nodes = renameNode(sample(), [1, 0], 'Renamed')
    expect(getNode(nodes, [1, 0])?.name).toBe('Renamed')
  })

  it('removes a node together with its subtree', () => {
    const { nodes, path } = removeNode(sample(), [1])
    expect(nodes.map((n) => n.name)).toEqual(['A'])
    expect(path).toBeNull()
  })

  it('does not mutate the input tree', () => {
    const original = sample()
    const snapshot = JSON.parse(JSON.stringify(original))
    insertSibling(original, [0], 'X')
    insertChild(original, [1], 'Y')
    renameNode(original, [1, 0], 'Z')
    removeNode(original, [0])
    expect(original).toEqual(snapshot)
  })

  it('moves a node among its siblings and keeps it selected', () => {
    const moved = moveNode(sample(), [1], -1)
    expect(moved.nodes.map((n) => n.name)).toEqual(['B', 'A'])
    expect(moved.path).toEqual([0])
  })

  it('does not move past the first or last sibling', () => {
    const first = moveNode(sample(), [0], -1)
    expect(first.nodes.map((n) => n.name)).toEqual(['A', 'B'])
    expect(first.path).toEqual([0])
    const last = moveNode(sample(), [1], 1)
    expect(last.nodes.map((n) => n.name)).toEqual(['A', 'B'])
  })

  it('moves a child inside its parent', () => {
    const moved = moveNode(sample(), [1, 1], -1)
    expect(moved.nodes[1].children?.map((n) => n.name)).toEqual(['B2', 'B1'])
    expect(moved.path).toEqual([1, 0])
  })

  it('returns null for a missing path', () => {
    expect(getNode(sample(), [5])).toBeNull()
  })
})

describe('canReparent', () => {
  it('refuses to nest a bin into itself or into its own subtree', () => {
    expect(canReparent([0], [0])).toBe(false)
    expect(canReparent([0], [0, 1, 0])).toBe(false)
  })

  it('refuses a drop onto the bin that already holds it', () => {
    expect(canReparent([0, 1], [0])).toBe(false)
    expect(canReparent([1], null)).toBe(false)
  })

  it('allows nesting under another bin, and moving a child to the top level', () => {
    expect(canReparent([1], [0])).toBe(true)
    expect(canReparent([0, 1], null)).toBe(true)
    expect(canReparent([0, 1], [2])).toBe(true)
  })
})

describe('reparentNode', () => {
  const nested = (): BinNode[] =>
    cloneTree([
      { name: 'A', children: [{ name: 'A1' }, { name: 'A2', children: [{ name: 'A2a' }] }] },
      { name: 'B' },
      { name: 'C' },
    ])

  it('makes a top-level bin the last child of another bin, keeping its subtree', () => {
    const result = reparentNode(nested(), [0], [1])
    expect(result.nodes.map((node) => node.name)).toEqual(['B', 'C'])
    expect(getNode(result.nodes, [0])?.children?.map((node) => node.name)).toEqual(['A'])
    expect(getNode(result.nodes, [0, 0])?.children?.map((node) => node.name)).toEqual(['A1', 'A2'])
    expect(result.path).toEqual([0, 0])
  })

  it('appends after existing children', () => {
    const result = reparentNode(nested(), [2], [0])
    expect(getNode(result.nodes, [0])?.children?.map((node) => node.name)).toEqual(['A1', 'A2', 'C'])
    expect(result.path).toEqual([0, 2])
  })

  it('moves a child to the top level when the target is the project root', () => {
    const result = reparentNode(nested(), [0, 1], null)
    expect(result.nodes.map((node) => node.name)).toEqual(['A', 'B', 'C', 'A2'])
    expect(result.path).toEqual([3])
  })

  it('keeps ids, so the bin still follows its manual position', () => {
    const before = nested()
    const id = getNode(before, [2])?.id
    const result = reparentNode(before, [2], [0])
    expect(getNode(result.nodes, [0, 2])?.id).toBe(id)
  })

  it('does not change the input tree', () => {
    const before = nested()
    reparentNode(before, [0], [1])
    expect(before.map((node) => node.name)).toEqual(['A', 'B', 'C'])
  })

  it('finds a nested bin by id', () => {
    const nodes = nested()
    const id = getNode(nodes, [0, 1, 0])?.id ?? ''
    expect(findPath(nodes, id)).toEqual([0, 1, 0])
    expect(findPath(nodes, 'missing')).toBeNull()
  })
})

describe('loose bins', () => {
  it('adds a loose bin at the top level', () => {
    const result = addLoose(DEFAULT_STRUCTURE, 'Solto')
    expect(result.path).toEqual([DEFAULT_STRUCTURE.length])
    expect(getNode(result.nodes, result.path)).toMatchObject({ name: 'Solto', loose: true })
  })

  it('leaves loose bins out of the connected tree at every level', () => {
    const { nodes } = addLoose(cloneTree([{ name: 'A', children: [{ name: 'A1' }] }]), 'Solto')
    const connected = connectedNodes(nodes)
    expect(connected.map((node) => node.name)).toEqual(['A'])
    expect(countFolders(connected)).toBe(2)
  })

  it('connects a loose bin when it is dropped under another bin', () => {
    const { nodes } = addLoose(cloneTree([{ name: 'A' }]), 'Solto')
    const result = reparentNode(nodes, [1], [0])
    expect(getNode(result.nodes, [0, 0])).toMatchObject({ name: 'Solto' })
    expect(getNode(result.nodes, [0, 0])?.loose).toBeUndefined()
  })

  it('keeps the loose flag when the tree is copied', () => {
    const { nodes } = addLoose([], 'Solto')
    expect(cloneTree(nodes)[0].loose).toBe(true)
  })
})
