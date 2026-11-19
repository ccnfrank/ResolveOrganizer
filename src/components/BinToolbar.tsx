import { ArrowDown, ArrowUp, FolderPlus, FolderTree, Pencil, Trash2 } from 'lucide-react'
import type { Messages } from '../i18n/messages'

type BinToolbarProps = {
  t: Messages
  hasSelection: boolean
  onAddSibling: () => void
  onAddChild: () => void
  onRename: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const baseBtn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40'

export function BinToolbar(props: BinToolbarProps) {
  const { t, hasSelection } = props
  return (
    <div role="toolbar" aria-label={t.treeLabel} className="flex flex-wrap gap-2">
      <button type="button" onClick={props.onAddSibling} className={`${baseBtn} border-line bg-panel text-text hover:bg-white/[0.06]`}>
        <FolderPlus size={16} aria-hidden="true" />
        {t.addBin}
      </button>
      <button type="button" onClick={props.onAddChild} disabled={!hasSelection} className={`${baseBtn} border-line bg-panel text-text hover:bg-white/[0.06]`}>
        <FolderTree size={16} aria-hidden="true" />
        {t.addSubBin}
      </button>
      <button type="button" onClick={props.onRename} disabled={!hasSelection} className={`${baseBtn} border-line bg-panel text-text hover:bg-white/[0.06]`}>
        <Pencil size={16} aria-hidden="true" />
        {t.rename}
      </button>
      <button type="button" onClick={props.onMoveUp} disabled={!hasSelection} aria-label={t.moveUp} className={`${baseBtn} border-line bg-panel px-2.5 text-text hover:bg-white/[0.06]`}>
        <ArrowUp size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={props.onMoveDown} disabled={!hasSelection} aria-label={t.moveDown} className={`${baseBtn} border-line bg-panel px-2.5 text-text hover:bg-white/[0.06]`}>
        <ArrowDown size={16} aria-hidden="true" />
      </button>
      <button type="button" onClick={props.onRemove} disabled={!hasSelection} className={`${baseBtn} border-danger/30 bg-danger/10 text-red-200 hover:bg-danger/20`}>
        <Trash2 size={16} aria-hidden="true" />
        {t.remove}
      </button>
    </div>
  )
}
