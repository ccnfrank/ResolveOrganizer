import { describe, expect, it } from 'vitest'
import { createProjectTree, type FolderTarget, type RenderProgress } from './fileSystem'
import { DEFAULT_STRUCTURE, type BinNode } from './binTree'

/** Minimal fake folder that records every folder it is asked to create. */
function fakeFolder(name: string, log: string[]): FolderTarget {
  return {
    name,
    async hasFolder() {
      return false
    },
    async childFolder(child: string) {
      log.push(`${name}/${child}`)
      return fakeFolder(child, log)
    },
  }
}

describe('createProjectTree', () => {
  it('creates the project folder and every bin in the default structure', async () => {
    const log: string[] = []
    const root = fakeFolder('root', log)

    await createProjectTree(root, 'Demo', DEFAULT_STRUCTURE)

    expect(log[0]).toBe('root/Demo')
    expect(log).toContain('Demo/00_Footage')
    expect(log).toContain('03_Assets/Graficos')
    expect(log).toContain('02_Audio/VO')
    // 1 project + 13 folders
    expect(log).toHaveLength(14)
  })

  it('creates nested children under their parent', async () => {
    const log: string[] = []
    const tree: BinNode[] = [{ name: 'A', children: [{ name: 'B' }] }]

    await createProjectTree(fakeFolder('root', log), 'P', tree)

    expect(log).toEqual(['root/P', 'P/A', 'A/B'])
  })

  it('reports progress once per folder, in creation order', async () => {
    const events: RenderProgress[] = []
    const tree: BinNode[] = [{ name: 'A', children: [{ name: 'B' }] }, { name: 'C' }]

    await createProjectTree(fakeFolder('root', []), 'P', tree, (event) => {
      events.push(event)
    })

    expect(events).toEqual([
      { done: 1, total: 4, path: null },
      { done: 2, total: 4, path: [0] },
      { done: 3, total: 4, path: [0, 0] },
      { done: 4, total: 4, path: [1] },
    ])
  })
})
