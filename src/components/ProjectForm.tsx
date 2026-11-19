import { FolderOpen, Rocket, RotateCcw } from 'lucide-react'
import type { Messages } from '../i18n/messages'

type ProjectFormProps = {
  t: Messages
  projectName: string
  destinationLabel: string
  busy: boolean
  onProjectNameChange: (value: string) => void
  onSelectFolder: () => void
  onCreate: () => void
  onReset: () => void
}

const inputClass =
  'w-full min-w-0 rounded-md border border-line bg-bg px-4 py-3 font-mono text-text placeholder:text-muted/60 outline-none transition hover:border-white/20 focus:border-accent focus:ring-4 focus:ring-accent/20'

export function ProjectForm(props: ProjectFormProps) {
  const { t, busy } = props
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <label className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
        <span className="text-sm text-muted">{t.projectName}</span>
        <input
          type="text"
          value={props.projectName}
          placeholder={t.projectPlaceholder}
          autoComplete="off"
          onChange={(event) => props.onProjectNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') props.onCreate()
          }}
          className={inputClass}
        />
      </label>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
        <span className="text-sm text-muted">{t.destination}</span>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2.5">
          <div className="flex min-w-0 items-center rounded-md border border-line bg-bg px-4 py-3 font-mono text-sm text-text/80">
            <span className="truncate">{props.destinationLabel}</span>
          </div>
          <button
            type="button"
            onClick={props.onSelectFolder}
            disabled={busy}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-line bg-panel px-4 text-sm font-medium text-text transition hover:bg-white/[0.06] disabled:opacity-40"
          >
            <FolderOpen size={16} aria-hidden="true" />
            {t.selectFolder}
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={props.onCreate}
          disabled={busy}
          className="group inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-accent px-5 py-3 text-sm font-semibold tracking-wide text-ink transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
        >
          <Rocket size={17} aria-hidden="true" className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          {busy ? t.creatingBusy : t.createProject}
        </button>
        <button
          type="button"
          onClick={props.onReset}
          disabled={busy}
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-line bg-panel px-4 py-3 text-sm font-medium text-text transition hover:bg-white/[0.06] disabled:opacity-40"
        >
          <RotateCcw size={16} aria-hidden="true" />
          {t.reset}
        </button>
      </div>
    </div>
  )
}
