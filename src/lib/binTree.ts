export type BinNode = {
  /** Stable identity: survives renames and moves, so a dragged position follows its bin. */
  id?: string
  name: string
  children?: BinNode[]
  /**
   * A new bin that is not yet nested under another: drawn loose on the graph and left out of the
   * project folder until it is dropped onto a bin.
   */
  loose?: boolean
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
    ...(node.loose ? { loose: true } : {}),
  }))
}

/** The bins that belong to the project: everything except loose bins, at every level. */
export function connectedNodes(nodes: BinNode[]): BinNode[] {
  return nodes
    .filter((node) => !node.loose)
    .map((node) => ({
      ...node,
      ...(node.children ? { children: connectedNodes(node.children) } : {}),
    }))
}

/** Adds a loose bin at the top level. It has no parent and no children. */
export function addLoose(nodes: BinNode[], name: string): { nodes: BinNode[]; path: Path } {
  const next = cloneTree(nodes)
  next.push({ id: createId(), name, loose: true })
  return { nodes: next, path: [next.length - 1] }
}

/**
 * Takes a sub-bin out of its parent and leaves it loose at the top level.
 * Its own sub-bins go with it. Returns null for top-level bins, which have no parent to leave.
 */
export function detachNode(nodes: BinNode[], path: Path): { nodes: BinNode[]; path: Path } | null {
  if (path.length < 2) return null
  const next = cloneTree(nodes)
  const moving = getNode(next, path)
  const parent = getNode(next, path.slice(0, -1))
  if (!moving || !parent?.children) return null
  parent.children.splice(path[path.length - 1], 1)
  if (parent.children.length === 0) delete parent.children
  moving.loose = true
  next.push(moving)
  return { nodes: next, path: [next.length - 1] }
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

/**
 * Whether the node at `from` can become a child of the node at `to` (`null` is the project root).
 * Not into itself or into its own subtree, and not where it already is.
 */
export function canReparent(from: Path, to: Path | null): boolean {
  if (from.length === 0) return false
  const destination = to ?? []
  const insideItself =
    destination.length >= from.length && from.every((index, depth) => destination[depth] === index)
  if (insideItself) return false
  const parent = from.slice(0, -1)
  const alreadyThere =
    parent.length === destination.length && parent.every((index, depth) => destination[depth] === index)
  return !alreadyThere
}

/** Path of the node with `id`, or null when no node has it. */
export function findPath(nodes: BinNode[], id: string, prefix: Path = []): Path | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    const path = [...prefix, index]
    if (node.id === id) return path
    const found = node.children ? findPath(node.children, id, path) : null
    if (found) return found
  }
  return null
}

/**
 * Moves the node at `from` to the end of the children of the node at `to` (`null` puts it at the
 * top level). Its subtree moves with it. Callers check `canReparent` first.
 */
export function reparentNode(
  nodes: BinNode[],
  from: Path,
  to: Path | null,
): { nodes: BinNode[]; path: Path } {
  const next = cloneTree(nodes)
  const moving = getNode(next, from)
  if (!moving) return { nodes: next, path: from }
  const destination = to === null ? null : getNode(next, to)
  if (to !== null && !destination) return { nodes: next, path: from }

  const parentPath = from.slice(0, -1)
  const siblings = parentPath.length === 0 ? next : getNode(next, parentPath)?.children
  if (!siblings) return { nodes: next, path: from }
  siblings.splice(from[from.length - 1], 1)
  // Moving a bin under another connects it.
  delete moving.loose

  if (destination) {
    destination.children = [...(destination.children ?? []), moving]
  } else {
    next.push(moving)
  }
  return { nodes: next, path: findPath(next, moving.id ?? '') ?? from }
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
