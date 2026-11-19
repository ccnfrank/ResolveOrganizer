import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp, CornerDownRight, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import type { Messages } from '../i18n/messages'

type BinActionsProps = {
  t: Messages
  hasSelection: boolean
  onAddSibling: () => void
  onAddChild: () => void
  onRename: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  danger,
  onClick,
}: {
  icon: LucideIcon
  label: string
  disabled?: boolean
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border border-edge bg-ground px-2 py-3 text-xs text-dim transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35 ${
        danger ? 'hover:border-danger/50 hover:text-danger' : 'hover:border-dim/50 hover:text-fg'
      }`}
    >
      <Icon size={17} aria-hidden="true" className="transition duration-200 group-hover:-translate-y-0.5" />
      <span className="text-center leading-tight">{label}</span>
    </button>
  )
}

/** Tools for the selected bin, shown as a dock under the graph. */
export function BinActions({
  t,
  hasSelection,
  onAddSibling,
  onAddChild,
  onRename,
  onRemove,
  onMoveUp,
  onMoveDown,
}: BinActionsProps) {
  return (
    <div role="toolbar" aria-label={t.structure} className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      <ActionButton icon={FolderPlus} label={t.addBin} onClick={onAddSibling} />
      <ActionButton icon={CornerDownRight} label={t.addSubBin} disabled={!hasSelection} onClick={onAddChild} />
      <ActionButton icon={Pencil} label={t.rename} disabled={!hasSelection} onClick={onRename} />
      <ActionButton icon={ArrowUp} label={t.moveUp} disabled={!hasSelection} onClick={onMoveUp} />
      <ActionButton icon={ArrowDown} label={t.moveDown} disabled={!hasSelection} onClick={onMoveDown} />
      <ActionButton icon={Trash2} label={t.remove} danger disabled={!hasSelection} onClick={onRemove} />
    </div>
  )
}
