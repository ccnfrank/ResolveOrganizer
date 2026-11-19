import type { BinNode, Path } from './binTree'

/**
 * `graph`: columns by depth, edges as bezier curves (wide screens). Bins can be dragged anywhere.
 * `list`: indented rows with elbow rails (narrow screens, where a graph would shrink to unreadable).
 */
export type LayoutMode = 'graph' | 'list'

export type Point = { x: number; y: number }

/** Manual positions by bin id. Only the graph mode honours them. */
export type Positions = Record<string, Point>

export type LayoutOptions = {
  mode: LayoutMode
  nodeWidth: number
  nodeHeight: number
  /** Vertical space between rows. */
  gapY: number
  /** Horizontal gap between columns in graph mode, indent per level in list mode. */
  step: number
  positions?: Positions
}

export type LayoutItem = {
  /** Path-based key, used for selection and rendering state. */
  key: string
  /** Stable id, used for manual positions. */
  id: string
  /** null for the project root. */
  path: Path | null
  name: string
  childCount: number
  /** 0 is the project root; top-level bins are 1. */
  depth: number
  /** Depth-first position, used for staggered entrance timing. */
  order: number
  /** Where the bin sits now: automatic, or the manual position if it was dragged. */
  x: number
  y: number
  /** Automatic position, before any manual move. */
  autoX: number
  autoY: number
  width: number
  height: number
}

export type LayoutEdge = {
  from: string
  to: string
  d: string
}

export type Layout = {
  items: LayoutItem[]
  edges: LayoutEdge[]
  width: number
  height: number
}

export const ROOT_KEY = 'root'

export function pathKey(path: Path | null): string {
  return path ? path.join('.') : ROOT_KEY
}

function graphEdge(parent: LayoutItem, child: LayoutItem): string {
  const x1 = parent.x + parent.width
  const y1 = parent.y + parent.height / 2
  const x2 = child.x
  const y2 = child.y + child.height / 2
  const control = Math.max(16, Math.abs(x2 - x1) / 2)
  return `M${x1} ${y1} C${x1 + control} ${y1} ${x2 - control} ${y2} ${x2} ${y2}`
}

function listEdge(parent: LayoutItem, child: LayoutItem): string {
  const rail = parent.x + 10
  const y2 = child.y + child.height / 2
  return `M${rail} ${parent.y + parent.height} V${y2} H${child.x}`
}

/** Pure geometry for the bin graph: positions in unscaled pixels, plus the edges between them. */
export function layoutTree(rootName: string, nodes: BinNode[], opts: LayoutOptions): Layout {
  const { mode, nodeWidth, nodeHeight, gapY, step, positions = {} } = opts
  const stride = nodeHeight + gapY
  const items: LayoutItem[] = []
  const parentOf = new Map<string, string>()

  const place = (
    key: string,
    id: string,
    path: Path | null,
    name: string,
    childCount: number,
    depth: number,
  ) => {
    const order = items.length
    const autoX = depth * (mode === 'graph' ? nodeWidth + step : step)
    const autoY = order * stride
    const manual = mode === 'graph' ? positions[id] : undefined
    items.push({
      key,
      id,
      path,
      name,
      childCount,
      depth,
      order,
      x: manual?.x ?? autoX,
      y: manual?.y ?? autoY,
      autoX,
      autoY,
      width: nodeWidth,
      height: nodeHeight,
    })
  }

  place(ROOT_KEY, ROOT_KEY, null, rootName, nodes.length, 0)

  const visit = (list: BinNode[], prefix: Path, parentKey: string) => {
    list.forEach((node, index) => {
      const path = [...prefix, index]
      const key = pathKey(path)
      parentOf.set(key, parentKey)
      place(key, node.id ?? key, path, node.name, node.children?.length ?? 0, path.length)
      if (node.children?.length) visit(node.children, path, key)
    })
  }
  visit(nodes, [], ROOT_KEY)

  const byKey = new Map(items.map((item) => [item.key, item]))
  const edges: LayoutEdge[] = []
  for (const item of items) {
    const parentKey = parentOf.get(item.key)
    const parent = parentKey ? byKey.get(parentKey) : undefined
    if (!parent || !parentKey) continue
    edges.push({
      from: parentKey,
      to: item.key,
      d: mode === 'graph' ? graphEdge(parent, item) : listEdge(parent, item),
    })
  }

  return {
    items,
    edges,
    width: Math.max(...items.map((item) => item.x + item.width)),
    height: Math.max(...items.map((item) => item.y + item.height)),
  }
}
