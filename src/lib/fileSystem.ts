import { invoke, isTauri } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { countFolders, type BinNode, type Path } from './binTree'

/**
 * A folder the project is written into. The browser hands over a File System Access handle; the
 * desktop app hands over a native path, because WKWebView (the macOS web engine) has no directory picker.
 */
export interface FolderTarget {
  name: string
  /** True when a folder called `name` is already directly inside this one. */
  hasFolder(name: string): Promise<boolean>
  /** The folder called `name` inside this one, created when it is missing. */
  childFolder(name: string): Promise<FolderTarget>
}

type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

/** One event per folder created. `path` is null for the project folder itself. */
export type RenderProgress = { done: number; total: number; path: Path | null }

export type RenderListener = (event: RenderProgress) => void | Promise<void>

export function supportsDirectoryPicker(): boolean {
  if (isTauri()) return true
  return typeof window !== 'undefined' && typeof (window as PickerWindow).showDirectoryPicker === 'function'
}

function fromHandle(handle: FileSystemDirectoryHandle): FolderTarget {
  return {
    name: handle.name,
    async hasFolder(name) {
      try {
        await handle.getDirectoryHandle(name)
        return true
      } catch (error) {
        if ((error as { name?: string })?.name === 'NotFoundError') return false
        throw error
      }
    },
    async childFolder(name) {
      return fromHandle(await handle.getDirectoryHandle(name, { create: true }))
    },
  }
}

function joinPath(parent: string, child: string): string {
  return `${parent.replace(/\/+$/, '')}/${child}`
}

function fromPath(path: string): FolderTarget {
  const name = path.split('/').filter(Boolean).pop() ?? path
  return {
    name,
    hasFolder: (child) => invoke<boolean>('folder_exists', { path: joinPath(path, child) }),
    async childFolder(child) {
      const next = joinPath(path, child)
      await invoke('create_folder', { path: next })
      return fromPath(next)
    },
  }
}

/** Returns null when the user cancels the picker; rethrows any other error. */
export async function pickDirectory(): Promise<FolderTarget | null> {
  if (isTauri()) {
    const selected = await open({ directory: true, multiple: false })
    return typeof selected === 'string' ? fromPath(selected) : null
  }
  const picker = (window as PickerWindow).showDirectoryPicker
  if (!picker) throw new Error('unsupported')
  try {
    return fromHandle(await picker({ mode: 'readwrite' }))
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') return null
    throw error
  }
}

/** True when `parent` already holds a folder called `name`. Other errors are rethrown. */
export async function folderExists(parent: FolderTarget, name: string): Promise<boolean> {
  return parent.hasFolder(name)
}

type Report = (path: Path | null) => Promise<void>

async function createNodes(parent: FolderTarget, nodes: BinNode[], prefix: Path, report: Report) {
  for (const [index, node] of nodes.entries()) {
    const path = [...prefix, index]
    const folder = await parent.childFolder(node.name)
    await report(path)
    if (node.children?.length) {
      await createNodes(folder, node.children, path, report)
    }
  }
}

/**
 * Creates `<parent>/<projectName>/` and the whole bin tree inside it.
 * `onProgress` runs after each folder and is awaited, so a listener can pace the UI.
 */
export async function createProjectTree(
  parent: FolderTarget,
  projectName: string,
  nodes: BinNode[],
  onProgress?: RenderListener,
): Promise<void> {
  const total = countFolders(nodes) + 1
  let done = 0
  const report: Report = async (path) => {
    done += 1
    await onProgress?.({ done, total, path })
  }

  const project = await parent.childFolder(projectName)
  await report(null)
  await createNodes(project, nodes, [], report)
}
