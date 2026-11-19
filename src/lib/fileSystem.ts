import type { BinNode } from './binTree'

type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>
}

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

async function createNodes(parent: FileSystemDirectoryHandle, nodes: BinNode[]): Promise<void> {
  for (const node of nodes) {
    const handle = await parent.getDirectoryHandle(node.name, { create: true })
    if (node.children?.length) {
      await createNodes(handle, node.children)
    }
  }
}

/** Creates `<parent>/<projectName>/` and the whole bin tree inside it. */
export async function createProjectTree(
  parent: FileSystemDirectoryHandle,
  projectName: string,
  nodes: BinNode[],
): Promise<void> {
  const project = await parent.getDirectoryHandle(projectName, { create: true })
  await createNodes(project, nodes)
}
