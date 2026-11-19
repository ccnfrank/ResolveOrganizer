import { describe, expect, it } from 'vitest'
import { createProjectTree } from './fileSystem'
import { DEFAULT_STRUCTURE, type BinNode } from './binTree'

/** Minimal fake of FileSystemDirectoryHandle that records the created path. */
function fakeDir(name: string, log: string[]) {
  return {
    name,
    async getDirectoryHandle(child: string, _opts?: { create?: boolean }) {
      log.push(`${name}/${child}`)
      return fakeDir(child, log)
    },
  } as unknown as FileSystemDirectoryHandle
}

describe('createProjectTree', () => {
  it('creates the project folder and every bin in the default structure', async () => {
    const log: string[] = []
    const root = fakeDir('root', log)

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

    await createProjectTree(fakeDir('root', log), 'P', tree)

    expect(log).toEqual(['root/P', 'P/A', 'A/B'])
  })
})
