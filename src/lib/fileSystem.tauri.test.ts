import { beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { createProjectTree, folderExists, pickDirectory } from './fileSystem'

// The desktop app runs the same code with native paths instead of browser handles.
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: () => true,
  invoke: vi.fn(),
}))
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}))

describe('desktop folders', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset()
    vi.mocked(open).mockReset()
  })

  it('names the picked folder after its last path segment', async () => {
    vi.mocked(open).mockResolvedValue('/Volumes/Media/Projects')
    const folder = await pickDirectory()
    expect(folder?.name).toBe('Projects')
  })

  it('returns null when the picker is cancelled', async () => {
    vi.mocked(open).mockResolvedValue(null)
    expect(await pickDirectory()).toBeNull()
  })

  it('creates the project and its bins as native folders under the picked path', async () => {
    vi.mocked(open).mockResolvedValue('/Volumes/Media/Projects/')
    vi.mocked(invoke).mockResolvedValue(undefined)
    const folder = await pickDirectory()
    if (!folder) throw new Error('expected a folder')

    await createProjectTree(folder, 'Demo', [{ name: 'A', children: [{ name: 'B' }] }])

    expect(invoke).toHaveBeenNthCalledWith(1, 'create_folder', { path: '/Volumes/Media/Projects/Demo' })
    expect(invoke).toHaveBeenNthCalledWith(2, 'create_folder', { path: '/Volumes/Media/Projects/Demo/A' })
    expect(invoke).toHaveBeenNthCalledWith(3, 'create_folder', { path: '/Volumes/Media/Projects/Demo/A/B' })
  })

  it('asks the native side whether a project folder already exists', async () => {
    vi.mocked(open).mockResolvedValue('/Volumes/Media')
    vi.mocked(invoke).mockResolvedValue(true)
    const folder = await pickDirectory()
    if (!folder) throw new Error('expected a folder')

    expect(await folderExists(folder, 'Demo')).toBe(true)
    expect(invoke).toHaveBeenCalledWith('folder_exists', { path: '/Volumes/Media/Demo' })
  })
})
