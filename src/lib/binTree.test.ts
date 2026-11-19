import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STRUCTURE,
  countFolders,
  getNode,
  insertChild,
  insertSibling,
  moveNode,
  removeNode,
  renameNode,
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
