import type { Ref } from 'react'
import { ChevronRight, HardDrive, RotateCcw } from 'lucide-react'
import type { Messages } from '../i18n/messages'
import { RenderButton } from './RenderButton'

type ProjectFormProps = {
  t: Messages
  projectName: string
  destinationLabel: string
  busy: boolean
  progress: { done: number; total: number } | null
  renderRef: Ref<HTMLButtonElement>
  onProjectNameChange: (value: string) => void
  onSelectFolder: () => void
  onCreate: () => void
  onReset: () => void
}

const fieldClass =
  'h-12 w-full min-w-0 rounded-xl border border-edge bg-ground px-4 font-mono text-[15px] text-fg outline-none transition placeholder:text-dim/55 hover:border-dim/50 focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]'

export function ProjectForm(props: ProjectFormProps) {
  const { t, busy, progress } = props
  const ratio = progress && progress.total > 0 ? progress.done / progress.total : 0

  return (
    <div className="grid gap-6">
      <label className="grid gap-2">
        <span className="text-sm text-dim">{t.projectName}</span>
        <input
          type="text"
          value={props.projectName}
          placeholder={t.projectPlaceholder}
          autoComplete="off"
          disabled={busy}
          onChange={(event) => props.onProjectNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') props.onCreate()
          }}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-2">
        <span className="text-sm text-dim">{t.destination}</span>
        <button
          type="button"
          onClick={props.onSelectFolder}
          disabled={busy}
          className="group flex min-w-0 items-center gap-3 rounded-xl border border-edge bg-ground p-2.5 text-left transition duration-200 hover:border-dim/50 disabled:opacity-50"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-raised text-accent">
            <HardDrive size={18} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">{props.destinationLabel}</span>
            <span className="block text-xs text-dim">{t.selectFolder}</span>
          </span>
          <ChevronRight
            size={16}
            aria-hidden="true"
            className="shrink-0 text-dim transition duration-200 group-hover:translate-x-0.5 group-hover:text-fg"
          />
        </button>
      </div>

      <div className="grid gap-3">
        <RenderButton
          buttonRef={props.renderRef}
          label={t.createProject}
          busyLabel={t.creatingBusy}
          progressLabel={progress ? t.renderProgress(progress.done, progress.total) : ''}
          progress={ratio}
          busy={busy}
          disabled={busy}
          onClick={props.onCreate}
        />
        <button
          type="button"
          onClick={props.onReset}
          disabled={busy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm text-dim transition duration-200 hover:text-fg disabled:opacity-40"
        >
          <RotateCcw size={15} aria-hidden="true" />
          {t.reset}
        </button>
      </div>
    </div>
  )
}
