import { countFolders, type BinNode, type Path } from './binTree'

type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

/** One event per folder created. `path` is null for the project folder itself. */
export type RenderProgress = { done: number; total: number; path: Path | null }

export type RenderListener = (event: RenderProgress) => void | Promise<void>

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && typeof (window as PickerWindow).showDirectoryPicker === 'function'
}

/** Returns null when the user cancels the picker; rethrows any other error. */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const picker = (window as PickerWindow).showDirectoryPicker
  if (!picker) throw new Error('unsupported')
  try {
    return await picker({ mode: 'readwrite' })
  } catch (error) {
    if ((error as { name?: string })?.name === 'AbortError') return null
    throw error
  }
}

/** True when `parent` already holds a folder called `name`. Other errors are rethrown. */
export async function folderExists(parent: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await parent.getDirectoryHandle(name)
    return true
  } catch (error) {
    if ((error as { name?: string })?.name === 'NotFoundError') return false
    throw error
  }
}

type Report = (path: Path | null) => Promise<void>

async function createNodes(parent: FileSystemDirectoryHandle, nodes: BinNode[], prefix: Path, report: Report) {
  for (const [index, node] of nodes.entries()) {
    const path = [...prefix, index]
    const handle = await parent.getDirectoryHandle(node.name, { create: true })
    await report(path)
    if (node.children?.length) {
      await createNodes(handle, node.children, path, report)
    }
  }
}

/**
 * Creates `<parent>/<projectName>/` and the whole bin tree inside it.
 * `onProgress` runs after each folder and is awaited, so a listener can pace the UI.
 */
export async function createProjectTree(
  parent: FileSystemDirectoryHandle,
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

  const project = await parent.getDirectoryHandle(projectName, { create: true })
  await report(null)
  await createNodes(project, nodes, [], report)
}
