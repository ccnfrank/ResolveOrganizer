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
  /** A loose bin: drawn without a connector, in the lane to the right of the tree. */
  loose: boolean
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

/** Width the project root needs: its icon, the name, and room for its "+". */
const ROOT_CHROME = 82
/** Rough width of one character of the root name, in the root's type size. */
const ROOT_CHAR_WIDTH = 11
const ROOT_MAX_WIDTH = 320

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

  // The project root in graph mode grows to show its whole name, up to a limit. The bin columns
  // move right by the extra width, so the root never covers a column.
  const rootWidth =
    mode === 'graph'
      ? Math.min(ROOT_MAX_WIDTH, Math.max(nodeWidth, ROOT_CHROME + rootName.length * ROOT_CHAR_WIDTH))
      : nodeWidth
  const columnShift = rootWidth - nodeWidth

  const place = (
    key: string,
    id: string,
    path: Path | null,
    name: string,
    childCount: number,
    depth: number,
    loose = false,
  ) => {
    const order = items.length
    const isRoot = depth === 0
    const autoX = isRoot
      ? 0
      : mode === 'graph'
        ? columnShift + depth * (nodeWidth + step)
        : depth * step
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
      width: isRoot ? rootWidth : nodeWidth,
      height: nodeHeight,
      loose,
    })
  }

  place(ROOT_KEY, ROOT_KEY, null, rootName, nodes.length, 0)

  const visit = (list: BinNode[], prefix: Path, parentKey: string) => {
    list.forEach((node, index) => {
      const path = [...prefix, index]
      const key = pathKey(path)
      parentOf.set(key, parentKey)
      place(key, node.id ?? key, path, node.name, node.children?.length ?? 0, path.length, Boolean(node.loose))
      if (node.children?.length) visit(node.children, path, key)
    })
  }
  visit(nodes, [], ROOT_KEY)

  // Graph mode: loose bins line up in a lane to the right of the tree, unless they were dragged.
  if (mode === 'graph') {
    const laneX = Math.max(rootWidth, ...items.filter((item) => !item.loose).map((item) => item.autoX + item.width)) + 2 * step
    let lane = 0
    for (const item of items) {
      if (!item.loose) continue
      item.autoX = laneX
      item.autoY = lane * stride
      if (!positions[item.id]) {
        item.x = item.autoX
        item.y = item.autoY
      }
      lane += 1
    }
  }

  // Graph mode: the project root starts level with the middle of the connected bins, unless it was dragged.
  const connected = items.slice(1).filter((item) => !item.loose)
  if (mode === 'graph' && connected.length > 0) {
    const top = Math.min(...connected.map((item) => item.autoY))
    const bottom = Math.max(...connected.map((item) => item.autoY + item.height))
    const centre = (top + bottom - nodeHeight) / 2
    const root = items[0]
    root.autoY = centre
    if (!positions[ROOT_KEY]) root.y = centre
  }

  const byKey = new Map(items.map((item) => [item.key, item]))
  const edges: LayoutEdge[] = []
  for (const item of items) {
    const parentKey = parentOf.get(item.key)
    const parent = parentKey ? byKey.get(parentKey) : undefined
    // A loose bin has no connector.
    if (!parent || !parentKey || item.loose) continue
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
