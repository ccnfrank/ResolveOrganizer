export type BinNode = {
  /** Stable identity: survives renames and moves, so a dragged position follows its bin. */
  id?: string
  name: string
  children?: BinNode[]
}

/** Index path from the root list down to a node, e.g. [2, 0] = third root item's first child. */
export type Path = number[]

export const DEFAULT_STRUCTURE: BinNode[] = [
  { name: '00_Footage' },
  { name: '01_Proxy' },
  { name: '02_Audio', children: [{ name: 'VO' }, { name: 'SFX' }, { name: 'Music' }] },
  { name: '03_Assets', children: [{ name: 'Graficos' }] },
  { name: '04_Imagens' },
  { name: '05_Exports' },
  { name: '05_Documentos' },
  { name: '06_Cache_Proxies' },
  { name: '07_Renders' },
]

let idCounter = 0

export function createId(): string {
  idCounter += 1
  return `bin-${Date.now().toString(36)}-${idCounter.toString(36)}`
}

/** Deep copy with fresh arrays; nodes without an id receive one. */
export function cloneTree(nodes: BinNode[]): BinNode[] {
  return nodes.map((node) => ({
    id: node.id ?? createId(),
    name: node.name,
    ...(node.children ? { children: cloneTree(node.children) } : {}),
  }))
}

export function getNode(nodes: BinNode[], path: Path): BinNode | null {
  let current: BinNode[] = nodes
  let node: BinNode | null = null
  for (const index of path) {
    node = current[index] ?? null
    if (!node) return null
    current = node.children ?? []
  }
  return node
}

export function insertSibling(
  nodes: BinNode[],
  path: Path,
  name: string,
): { nodes: BinNode[]; path: Path } {
  const next = cloneTree(nodes)
  if (path.length === 0) {
    next.push({ id: createId(), name })
    return { nodes: next, path: [next.length - 1] }
  }
  const parentPath = path.slice(0, -1)
  const list = parentPath.length === 0 ? next : getNode(next, parentPath)?.children
  if (!list) return { nodes: next, path }
  const index = path[path.length - 1]
  list.splice(index + 1, 0, { id: createId(), name })
  return { nodes: next, path: [...parentPath, index + 1] }
}

export function insertChild(
  nodes: BinNode[],
  path: Path,
  name: string,
): { nodes: BinNode[]; path: Path } {
  const next = cloneTree(nodes)
  if (path.length === 0) {
    next.push({ id: createId(), name })
    return { nodes: next, path: [next.length - 1] }
  }
  const target = getNode(next, path)
  if (!target) return { nodes: next, path }
  target.children = target.children ?? []
  target.children.push({ id: createId(), name })
  return { nodes: next, path: [...path, target.children.length - 1] }
}

export function renameNode(nodes: BinNode[], path: Path, name: string): BinNode[] {
  const next = cloneTree(nodes)
  const target = getNode(next, path)
  if (target) target.name = name
  return next
}

/** Removes the node at `path` together with its subtree. Clears the selection. */
export function removeNode(nodes: BinNode[], path: Path): { nodes: BinNode[]; path: null } {
  const next = cloneTree(nodes)
  if (path.length === 0) return { nodes: next, path: null }
  const parentPath = path.slice(0, -1)
  const list = parentPath.length === 0 ? next : getNode(next, parentPath)?.children
  if (list) list.splice(path[path.length - 1], 1)
  return { nodes: next, path: null }
}

/** Swaps the node at `path` with its sibling in `direction` (-1 up, 1 down). Follows the node. */
export function moveNode(
  nodes: BinNode[],
  path: Path,
  direction: -1 | 1,
): { nodes: BinNode[]; path: Path } {
  const next = cloneTree(nodes)
  if (path.length === 0) return { nodes: next, path }
  const parentPath = path.slice(0, -1)
  const list = parentPath.length === 0 ? next : getNode(next, parentPath)?.children
  const index = path[path.length - 1]
  const target = index + direction
  if (!list || target < 0 || target >= list.length) return { nodes: next, path }
  ;[list[index], list[target]] = [list[target], list[index]]
  return { nodes: next, path: [...parentPath, target] }
}

export function countFolders(nodes: BinNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countFolders(node.children ?? []), 0)
}

/** Every id in the tree, used to drop positions of bins that no longer exist. */
export function collectIds(nodes: BinNode[], into = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (node.id) into.add(node.id)
    collectIds(node.children ?? [], into)
  }
  return into
}

/** Returns true when `path` still points at a node in `nodes`. */
export function isValidPath(nodes: BinNode[], path: Path | null): boolean {
  return !!path && getNode(nodes, path) !== null
}
