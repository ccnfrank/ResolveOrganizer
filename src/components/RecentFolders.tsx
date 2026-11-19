import { Clock } from 'lucide-react'
import type { Messages } from '../i18n/messages'

type RecentFoldersProps = {
  t: Messages
  names: string[]
  disabled: boolean
  onPick: (index: number) => void
}

/** Destinations used before, one click away. Each pick re-checks write permission. */
export function RecentFolders({ t, names, disabled, onPick }: RecentFoldersProps) {
  if (names.length === 0) return null
  return (
    <div className="grid gap-2">
      <span className="flex items-center gap-1.5 text-xs text-dim">
        <Clock size={13} aria-hidden="true" />
        {t.recentTitle}
      </span>
      <ul className="flex flex-wrap gap-2">
        {names.map((name, index) => (
          <li key={`${index}-${name}`}>
            <button
              type="button"
              onClick={() => onPick(index)}
              disabled={disabled}
              className="max-w-[12rem] truncate rounded-lg border border-edge bg-ground px-3 py-1.5 font-mono text-xs text-dim transition duration-200 hover:border-dim/50 hover:text-fg disabled:opacity-40"
              title={name}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
