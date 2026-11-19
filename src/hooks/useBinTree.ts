import { useState } from 'react'
import {
  DEFAULT_STRUCTURE,
  cloneTree,
  collectIds,
  getNode,
  insertChild,
  insertSibling,
  isValidPath,
  moveNode,
  removeNode,
  renameNode,
  type BinNode,
  type Path,
} from '../lib/binTree'
import { renumberTopLevel } from '../lib/diagnostics'
import { ROOT_KEY, type Point, type Positions } from '../lib/layout'

/** Everything an edit can change. Selection is UI state and stays out of the history. */
type Snapshot = { nodes: BinNode[]; positions: Positions }

type History = { present: Snapshot; past: Snapshot[]; future: Snapshot[] }

const HISTORY_LIMIT = 100

function prune(snapshot: Snapshot): Snapshot {
  // The project root is a draggable item too, so its position is kept alongside the bins'.
  const ids = collectIds(snapshot.nodes)
  ids.add(ROOT_KEY)
  const positions: Positions = {}
  for (const [id, point] of Object.entries(snapshot.positions)) {
    if (ids.has(id)) positions[id] = point
  }
  return { nodes: snapshot.nodes, positions }
}

export function useBinTree(initial: BinNode[] = DEFAULT_STRUCTURE) {
  const [history, setHistory] = useState<History>(() => ({
    present: { nodes: cloneTree(initial), positions: {} },
    past: [],
    future: [],
  }))
  const [selected, setSelected] = useState<Path | null>(null)

  const { nodes, positions } = history.present
  const selectedNode = selected ? getNode(nodes, selected) : null

  /** Records the current state, then applies `next`. Clears the redo branch. */
  const commit = (next: Snapshot) => {
    setHistory((h) => ({
      present: prune(next),
      past: [...h.past, h.present].slice(-HISTORY_LIMIT),
      future: [],
    }))
  }

  const addSibling = (name: string) => {
    const result = insertSibling(nodes, selected ?? [], name)
    commit({ nodes: result.nodes, positions })
    setSelected(result.path)
  }

  /** Returns false when nothing is selected, so the caller can explain why. */
  const addChild = (name: string): boolean => {
    if (!selected) return false
    const result = insertChild(nodes, selected, name)
    commit({ nodes: result.nodes, positions })
    setSelected(result.path)
    return true
  }

  const rename = (name: string) => {
    if (!selected) return
    commit({ nodes: renameNode(nodes, selected, name), positions })
  }

  const remove = (): boolean => {
    if (!selected) return false
    commit({ nodes: removeNode(nodes, selected).nodes, positions })
    setSelected(null)
    return true
  }

  const move = (direction: -1 | 1) => {
    if (!selected) return
    const result = moveNode(nodes, selected, direction)
    commit({ nodes: result.nodes, positions })
    setSelected(result.path)
  }

  /** Moves one bin on the graph. Manual positions are part of the history. */
  const setPosition = (id: string, point: Point) => {
    commit({ nodes, positions: { ...positions, [id]: point } })
  }

  const resetPositions = () => {
    if (Object.keys(positions).length === 0) return
    commit({ nodes, positions: {} })
  }

  /** Replaces the whole structure, for presets and imports. */
  const applyTree = (next: BinNode[]) => {
    commit({ nodes: cloneTree(next), positions: {} })
    setSelected(null)
  }

  const renumber = () => {
    commit({ nodes: renumberTopLevel(nodes), positions })
  }

  const undo = () => {
    const previous = history.past.at(-1)
    if (!previous) return
    setHistory({
      present: previous,
      past: history.past.slice(0, -1),
      future: [history.present, ...history.future],
    })
    if (!isValidPath(previous.nodes, selected)) setSelected(null)
  }

  const redo = () => {
    const following = history.future[0]
    if (!following) return
    setHistory({
      present: following,
      past: [...history.past, history.present],
      future: history.future.slice(1),
    })
    if (!isValidPath(following.nodes, selected)) setSelected(null)
  }

  const reset = () => {
    commit({ nodes: cloneTree(DEFAULT_STRUCTURE), positions: {} })
    setSelected(null)
  }

  return {
    nodes,
    positions,
    selected,
    selectedNode,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    select: setSelected,
    addSibling,
    addChild,
    rename,
    remove,
    move,
    setPosition,
    resetPositions,
    applyTree,
    renumber,
    undo,
    redo,
    reset,
  }
}
