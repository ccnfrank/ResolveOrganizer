import { cloneTree, type BinNode } from './binTree'

const NUMBERED = /^(\d+)_(.+)$/

export type PrefixConflict = {
  /** The shared number, e.g. "05" for 05_Exports and 05_Documentos. */
  prefix: string
  names: string[]
  /** Only top-level conflicts can be fixed by renumbering. */
  topLevel: boolean
}

/** Sibling bins that share a numeric prefix, checked at every level. */
export function findPrefixConflicts(nodes: BinNode[], topLevel = true): PrefixConflict[] {
  const groups = new Map<string, string[]>()
  for (const node of nodes) {
    const match = NUMBERED.exec(node.name)
    if (!match) continue
    groups.set(match[1], [...(groups.get(match[1]) ?? []), node.name])
  }
  const here: PrefixConflict[] = [...groups.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([prefix, names]) => ({ prefix, names, topLevel }))
  const nested = nodes.flatMap((node) => findPrefixConflicts(node.children ?? [], false))
  return [...here, ...nested]
}

/**
 * Renumbers the numbered top-level bins 00, 01, 02… in order, keeping their names and ids.
 * Unnumbered bins are left untouched.
 */
export function renumberTopLevel(nodes: BinNode[]): BinNode[] {
  const next = cloneTree(nodes)
  let index = 0
  for (const node of next) {
    const match = NUMBERED.exec(node.name)
    if (!match) continue
    node.name = `${String(index).padStart(2, '0')}_${match[2]}`
    index += 1
  }
  return next
}
