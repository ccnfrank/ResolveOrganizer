import { useState } from 'react'
import {
  DEFAULT_STRUCTURE,
  cloneTree,
  getNode,
  insertChild,
  insertSibling,
  moveNode,
  removeNode,
  renameNode,
  type BinNode,
  type Path,
} from '../lib/binTree'

export function useBinTree() {
  const [nodes, setNodes] = useState<BinNode[]>(() => cloneTree(DEFAULT_STRUCTURE))
  const [selected, setSelected] = useState<Path | null>(null)

  const selectedNode = selected ? getNode(nodes, selected) : null

  const addSibling = (name: string) => {
    const result = insertSibling(nodes, selected ?? [], name)
    setNodes(result.nodes)
    setSelected(result.path)
  }

  /** Returns false when nothing is selected, so the caller can explain why. */
  const addChild = (name: string): boolean => {
    if (!selected) return false
    const result = insertChild(nodes, selected, name)
    setNodes(result.nodes)
    setSelected(result.path)
    return true
  }

  const rename = (name: string) => {
    if (!selected) return
    setNodes(renameNode(nodes, selected, name))
  }

  const remove = (): boolean => {
    if (!selected) return false
    setNodes(removeNode(nodes, selected).nodes)
    setSelected(null)
    return true
  }

  const move = (direction: -1 | 1) => {
    if (!selected) return
    const result = moveNode(nodes, selected, direction)
    setNodes(result.nodes)
    setSelected(result.path)
  }

  const reset = () => {
    setNodes(cloneTree(DEFAULT_STRUCTURE))
    setSelected(null)
  }

  return {
    nodes,
    selected,
    selectedNode,
    select: setSelected,
    addSibling,
    addChild,
    rename,
    remove,
    move,
    reset,
  }
}
