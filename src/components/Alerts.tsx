import { CircleAlert } from 'lucide-react'
import type { Messages } from '../i18n/messages'

type AlertsProps = {
  t: Messages
  /** Name of a folder that already exists in the destination, or null. */
  existingName: string | null
}

/** Problems that would make the render merge into an old project. Shown, never blocking. */
export function Alerts({ t, existingName }: AlertsProps) {
  if (!existingName) return null

  return (
    <ul className="grid gap-2" aria-label={t.structure}>
      <li className="flex items-start gap-3 rounded-lg border border-accent/35 bg-accent/10 px-3.5 py-2.5 text-sm text-fg">
        <CircleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">{t.alertExists(existingName)}</span>
      </li>
    </ul>
  )
}
