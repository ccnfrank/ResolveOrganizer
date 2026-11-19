import type { Messages } from '../i18n/messages'

type OutputPreviewProps = {
  t: Messages
  destination: string
  root: string
  names: string[]
  hidden: number
}

/** What the render will create on disk, drawn as the same tree the user is editing. */
export function OutputPreview({ t, destination, root, names, hidden }: OutputPreviewProps) {
  const path = `${destination}/${root}/`
  return (
    <div className="grid gap-3 rounded-xl border border-edge bg-ground p-4">
      <span className="text-xs text-dim">{t.outputPreview}</span>
      <p className="truncate font-mono text-xs text-fg" title={path}>
        {path}
      </p>
      <ul className="grid gap-1 font-mono text-xs text-dim">
        {names.map((name, index) => (
          <li key={`${index}-${name}`} className="flex min-w-0 gap-2">
            <span aria-hidden="true" className="shrink-0 text-edge">
              {index === names.length - 1 && hidden === 0 ? '└' : '├'}
            </span>
            <span className="truncate">{name}/</span>
          </li>
        ))}
        {hidden > 0 && (
          <li className="flex gap-2 text-dim/70">
            <span aria-hidden="true" className="text-edge">
              └
            </span>
            <span>{t.moreItems(hidden)}</span>
          </li>
        )}
      </ul>
    </div>
  )
}
