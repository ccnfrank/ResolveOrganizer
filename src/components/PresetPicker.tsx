import { useRef } from 'react'
import { Bookmark, Download, Upload, X } from 'lucide-react'
import type { Messages } from '../i18n/messages'

export type PresetChip = { id: string; label: string; custom: boolean }

type PresetPickerProps = {
  t: Messages
  presets: PresetChip[]
  onApply: (id: string) => void
  onRemove: (id: string) => void
  onSave: () => void
  onExport: () => void
  onImportFile: (file: File) => void
}

/** Built-in and saved structures as chips, plus save, export and import. */
export function PresetPicker({ t, presets, onApply, onRemove, onSave, onExport, onImportFile }: PresetPickerProps) {
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <div className="grid gap-3">
      <span className="text-sm text-dim">{t.presetLabel}</span>
      <ul className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <li key={preset.id} className="flex">
            <button
              type="button"
              onClick={() => onApply(preset.id)}
              className={`rounded-l-lg border border-edge bg-ground px-3 py-1.5 text-xs text-fg transition duration-200 hover:border-accent/60 hover:text-accent ${
                preset.custom ? 'rounded-r-none' : 'rounded-lg'
              }`}
            >
              {preset.label}
            </button>
            {preset.custom && (
              <button
                type="button"
                onClick={() => onRemove(preset.id)}
                aria-label={t.removePreset(preset.label)}
                className="grid place-items-center rounded-r-lg border border-l-0 border-edge bg-ground px-2 text-dim transition duration-200 hover:text-danger"
              >
                <X size={12} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onSave} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-dim transition duration-200 hover:bg-raised hover:text-fg">
          <Bookmark size={13} aria-hidden="true" />
          {t.savePreset}
        </button>
        <button type="button" onClick={onExport} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-dim transition duration-200 hover:bg-raised hover:text-fg">
          <Download size={13} aria-hidden="true" />
          {t.exportPreset}
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-dim transition duration-200 hover:bg-raised hover:text-fg">
          <Upload size={13} aria-hidden="true" />
          {t.importPreset}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onImportFile(file)
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
