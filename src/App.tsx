import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useBinTree } from './hooks/useBinTree'
import { useLanguage } from './i18n/useLanguage'
import { countFolders, getNode, type BinNode, type Path } from './lib/binTree'
import { celebrate } from './lib/celebrate'
import { createProjectTree, folderExists, pickDirectory, supportsDirectoryPicker } from './lib/fileSystem'
import { pathKey } from './lib/layout'
import { prefersReducedMotion, sleep } from './lib/motion'
import {
  BUILTIN_PRESETS,
  loadCustomPresets,
  parsePreset,
  saveCustomPresets,
  serializePreset,
  type CustomPreset,
  type PresetId,
} from './lib/presets'
import { ensureWritable, loadRecentFolders, rememberFolder, type RecentFolder } from './lib/recentFolders'
import { sanitizeName } from './lib/sanitize'
import { Alerts } from './components/Alerts'
import { Brand } from './components/Brand'
import { BinActions } from './components/BinActions'
import { BinCanvas } from './components/BinCanvas'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LanguageSwitch } from './components/LanguageSwitch'
import { NameDialog } from './components/NameDialog'
import { OutputPreview } from './components/OutputPreview'
import { PresetPicker, type PresetChip } from './components/PresetPicker'
import { ProjectForm } from './components/ProjectForm'
import { RecentFolders } from './components/RecentFolders'
import { Splash } from './components/Splash'
import { StatusMessage, type Status } from './components/StatusMessage'
import type { Messages } from './i18n/messages'

type Dialog = 'sibling' | 'child' | 'rename' | 'remove' | 'savePreset' | 'exists' | null

type RenderState = {
  done: number
  total: number
  rendered: Set<string>
  last: string | null
}

const STATUS_TIMEOUT_MS = 3500
const SPLASH_MS = 1150
/** Pacing of the render loader: real folder creation is too fast to read. */
const RENDER_STEP_MS = 85
/** Top-level folders listed in the output preview before "+N more". */
const PREVIEW_ROWS = 6
const NAME_CHECK_DELAY_MS = 300

/** Folder names from the root down to `path`, used for the breadcrumb line. */
function pathNames(nodes: BinNode[], path: Path): string[] {
  return path.map((_, depth) => getNode(nodes, path.slice(0, depth + 1))?.name ?? '')
}

/** Every path in depth-first order, so arrow keys walk the graph the way it reads. */
function flattenPaths(nodes: BinNode[], prefix: Path = []): Path[] {
  return nodes.flatMap((node, index) => {
    const path = [...prefix, index]
    return [path, ...flattenPaths(node.children ?? [], path)]
  })
}

function downloadJson(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function celebrateOrigin(element: HTMLElement | null) {
  celebrate(element)
}

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const tree = useBinTree()

  const [projectName, setProjectName] = useState('')
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [recents, setRecents] = useState<RecentFolder[]>([])
  const [existingName, setExistingName] = useState<string | null>(null)
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => loadCustomPresets())
  const [render, setRender] = useState<RenderState | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [booting, setBooting] = useState(() => !prefersReducedMotion())
  const renderButtonRef = useRef<HTMLButtonElement>(null)

  const busy = render !== null
  const flash = useCallback((next: Status) => setStatus(next), [])

  // Success and info messages fade on their own; errors stay until the next action.
  useEffect(() => {
    if (!status || status.kind === 'error') return
    const timer = window.setTimeout(() => setStatus(null), STATUS_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (!booting) return
    const timer = window.setTimeout(() => setBooting(false), SPLASH_MS)
    return () => window.clearTimeout(timer)
  }, [booting])

  useEffect(() => {
    let alive = true
    void loadRecentFolders().then((list) => {
      if (alive) setRecents(list)
    })
    return () => {
      alive = false
    }
  }, [])

  // Warn while typing when the destination already holds a folder with this name.
  useEffect(() => {
    const name = sanitizeName(projectName)
    if (!dirHandle || !name) {
      setExistingName(null)
      return
    }
    let alive = true
    const timer = window.setTimeout(() => {
      folderExists(dirHandle, name)
        .then((exists) => {
          if (alive) setExistingName(exists ? name : null)
        })
        .catch(() => {
          if (alive) setExistingName(null)
        })
    }, NAME_CHECK_DELAY_MS)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [dirHandle, projectName])

  const previewRoot = sanitizeName(projectName) || t.projectPlaceholderRoot
  const folderTotal = countFolders(tree.nodes)

  const rememberChosen = async (handle: FileSystemDirectoryHandle) => {
    setDirHandle(handle)
    setRecents(await rememberFolder(handle))
  }

  const onSelectFolder = async () => {
    if (!supportsDirectoryPicker()) {
      flash({ kind: 'error', text: (m) => m.unsupported })
      return
    }
    try {
      const handle = await pickDirectory()
      if (handle) {
        await rememberChosen(handle)
        flash({ kind: 'success', text: (m) => m.folderSelected(handle.name) })
      }
    } catch {
      flash({ kind: 'error', text: (m) => m.folderSelectError })
    }
  }

  const onPickRecent = async (index: number) => {
    const entry = recents[index]
    if (!entry) return
    try {
      if (!(await ensureWritable(entry.handle))) {
        flash({ kind: 'error', text: (m) => m.permissionDenied })
        return
      }
      await rememberChosen(entry.handle)
      flash({ kind: 'success', text: (m) => m.folderSelected(entry.name) })
    } catch {
      flash({ kind: 'error', text: (m) => m.folderSelectError })
    }
  }

  const runRender = async (name: string, handle: FileSystemDirectoryHandle) => {
    setRender({ done: 0, total: folderTotal + 1, rendered: new Set(), last: null })
    flash({ kind: 'info', text: (m) => m.creating })
    try {
      await createProjectTree(handle, name, tree.nodes, async ({ done, total, path }) => {
        const key = pathKey(path)
        setRender((prev) => ({
          done,
          total,
          rendered: new Set([...(prev?.rendered ?? []), key]),
          last: key,
        }))
        await sleep(RENDER_STEP_MS)
      })
      setProjectName('')
      setExistingName(null)
      tree.select(null)
      celebrateOrigin(renderButtonRef.current)
      flash({ kind: 'success', text: (m) => m.created(name) })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      flash({ kind: 'error', text: (m) => m.createError(message) })
    } finally {
      setRender(null)
    }
  }

  const onCreate = async () => {
    const name = sanitizeName(projectName)
    if (!name) {
      flash({ kind: 'error', text: (m) => m.nameRequired })
      return
    }
    if (!dirHandle) {
      flash({ kind: 'error', text: (m) => m.folderRequired })
      return
    }
    let exists = false
    try {
      exists = await folderExists(dirHandle, name)
    } catch {
      exists = false
    }
    if (exists) {
      setDialog('exists')
      return
    }
    await runRender(name, dirHandle)
  }

  const onReset = () => {
    setProjectName('')
    setDirHandle(null)
    setExistingName(null)
    tree.reset()
    flash({ kind: 'info', text: (m) => m.cleared })
  }

  const requireSelection = (message: (m: Messages) => string): boolean => {
    if (tree.selected) return true
    flash({ kind: 'error', text: message })
    return false
  }

  const handleDialogSubmit = (name: string) => {
    if (dialog === 'sibling') {
      tree.addSibling(name)
      flash({ kind: 'success', text: (m) => m.added(name) })
    } else if (dialog === 'child') {
      if (tree.addChild(name)) flash({ kind: 'success', text: (m) => m.addedSub(name) })
    } else if (dialog === 'rename') {
      tree.rename(name)
      flash({ kind: 'success', text: (m) => m.renamedTo(name) })
    } else if (dialog === 'savePreset') {
      const preset: CustomPreset = { id: `custom-${Date.now().toString(36)}`, name, nodes: tree.nodes }
      const next = [...customPresets, preset]
      setCustomPresets(next)
      saveCustomPresets(next)
      flash({ kind: 'success', text: (m) => m.presetSaved(name) })
    }
    setDialog(null)
  }

  const handleRemove = () => {
    const name = tree.selectedNode?.name ?? ''
    if (tree.remove()) {
      flash({ kind: 'success', text: (m) => m.removed(name) })
    } else {
      flash({ kind: 'error', text: (m) => m.removeFailed })
    }
    setDialog(null)
  }

  const builtinLabel: Record<PresetId, string> = {
    default: t.presetDefault,
    documentary: t.presetDocumentary,
    commercial: t.presetCommercial,
    'music-video': t.presetMusicVideo,
  }
  const presetChips: PresetChip[] = [
    ...BUILTIN_PRESETS.map((preset) => ({ id: preset.id, label: builtinLabel[preset.id], custom: false })),
    ...customPresets.map((preset) => ({ id: preset.id, label: preset.name, custom: true })),
  ]

  const applyPreset = (id: string) => {
    const builtin = BUILTIN_PRESETS.find((preset) => preset.id === id)
    const custom = customPresets.find((preset) => preset.id === id)
    const nodes = builtin?.nodes ?? custom?.nodes
    const label = builtin ? builtinLabel[builtin.id] : custom?.name ?? ''
    if (!nodes) return
    tree.applyTree(nodes)
    flash({ kind: 'success', text: (m) => m.presetApplied(label) })
  }

  const removePreset = (id: string) => {
    const preset = customPresets.find((item) => item.id === id)
    if (!preset) return
    const next = customPresets.filter((item) => item.id !== id)
    setCustomPresets(next)
    saveCustomPresets(next)
    flash({ kind: 'info', text: (m) => m.presetRemoved(preset.name) })
  }

  const exportPreset = () => {
    const name = previewRoot
    downloadJson(`${name}.json`, serializePreset(name, tree.nodes))
    flash({ kind: 'success', text: (m) => m.presetExported(name) })
  }

  const importPresetFile = async (file: File) => {
    const result = parsePreset(await file.text())
    if (!result.ok) {
      flash({
        kind: 'error',
        text: (m) => (result.reason === 'tooLarge' ? m.presetTooLarge : m.presetInvalid),
      })
      return
    }
    tree.applyTree(result.nodes)
    flash({ kind: 'success', text: (m) => m.presetImported(result.name) })
  }

  // Keyboard: undo/redo always; graph navigation and bin edits only when no dialog or render is active.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || dialog || busy) return
      const target = event.target as HTMLElement | null
      if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return

      const key = event.key.toLowerCase()
      const mod = event.ctrlKey || event.metaKey
      if (mod && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        tree.undo()
        flash({ kind: 'info', text: (m) => m.undone })
        return
      }
      if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault()
        tree.redo()
        flash({ kind: 'info', text: (m) => m.redone })
        return
      }
      if (mod || event.shiftKey) return

      const paths = flattenPaths(tree.nodes)
      const current = tree.selected ? paths.findIndex((path) => pathKey(path) === pathKey(tree.selected)) : -1

      if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        if (!tree.selected) return
        event.preventDefault()
        tree.move(event.key === 'ArrowUp' ? -1 : 1)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (paths.length === 0) return
        const step = event.key === 'ArrowDown' ? 1 : -1
        const next = current < 0 ? (step > 0 ? 0 : paths.length - 1) : Math.min(paths.length - 1, Math.max(0, current + step))
        tree.select(paths[next])
      } else if (event.key === 'ArrowRight' && tree.selected) {
        const node = getNode(tree.nodes, tree.selected)
        if (node?.children?.length) {
          event.preventDefault()
          tree.select([...tree.selected, 0])
        }
      } else if (event.key === 'ArrowLeft' && tree.selected) {
        if (tree.selected.length > 1) {
          event.preventDefault()
          tree.select(tree.selected.slice(0, -1))
        }
      } else if ((event.key === 'Enter' || event.key === 'F2') && tree.selected) {
        event.preventDefault()
        setDialog('rename')
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && tree.selected) {
        event.preventDefault()
        setDialog('remove')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, busy, tree, flash])

  const dialogTitle =
    dialog === 'child'
      ? t.dialogNewSub
      : dialog === 'rename'
        ? t.dialogRename
        : dialog === 'savePreset'
          ? t.savePresetTitle
          : t.dialogNewBin

  const selectedPathLabel = tree.selected
    ? [previewRoot, ...pathNames(tree.nodes, tree.selected)].join('/') + '/'
    : ''

  const footer = (
    <div className="grid gap-4">
      <Alerts t={t} existingName={existingName} />
      <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-edge bg-ground px-3.5 py-2.5 font-mono text-xs text-dim">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-steel" />
        <span className="min-w-0 truncate" title={selectedPathLabel || undefined}>
          {selectedPathLabel || t.nothingSelected}
        </span>
      </div>
      <BinActions
        t={t}
        hasSelection={!!tree.selected}
        onAddSibling={() => setDialog('sibling')}
        onAddChild={() => {
          if (requireSelection((m) => m.selectFirstChild)) setDialog('child')
        }}
        onRename={() => {
          if (requireSelection((m) => m.selectFirst)) setDialog('rename')
        }}
        onRemove={() => {
          if (requireSelection((m) => m.selectFirst)) setDialog('remove')
        }}
        onMoveUp={() => tree.move(-1)}
        onMoveDown={() => tree.move(1)}
      />
    </div>
  )

  return (
    <div className="relative min-h-dvh">
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-8 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-between gap-5"
        >
          <div className="flex items-center gap-4">
            <Brand className="size-12 shrink-0" />
            <h1 className="text-4xl leading-none text-fg sm:text-5xl">{t.title}</h1>
          </div>
          <LanguageSwitch lang={lang} t={t} onChange={setLang} />
        </motion.header>

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid gap-7 rounded-2xl border border-edge bg-surface p-5 sm:p-6"
          >
            <ProjectForm
              t={t}
              projectName={projectName}
              destinationLabel={dirHandle?.name ?? t.noFolder}
              busy={busy}
              progress={render ? { done: render.done, total: render.total } : null}
              renderRef={renderButtonRef}
              onProjectNameChange={setProjectName}
              onSelectFolder={onSelectFolder}
              onCreate={onCreate}
              onReset={onReset}
            />
            <RecentFolders
              t={t}
              names={recents.map((entry) => entry.name)}
              disabled={busy}
              onPick={onPickRecent}
            />
            <PresetPicker
              t={t}
              presets={presetChips}
              onApply={applyPreset}
              onRemove={removePreset}
              onSave={() => setDialog('savePreset')}
              onExport={exportPreset}
              onImportFile={importPresetFile}
            />
            <OutputPreview
              t={t}
              destination={dirHandle?.name ?? '…'}
              root={previewRoot}
              names={tree.nodes.slice(0, PREVIEW_ROWS).map((node) => node.name)}
              hidden={Math.max(0, tree.nodes.length - PREVIEW_ROWS)}
            />
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="min-w-0 overflow-hidden rounded-2xl border border-edge bg-surface"
          >
            <BinCanvas
              t={t}
              rootLabel={previewRoot}
              nodes={tree.nodes}
              selected={tree.selected}
              onSelect={(path) => tree.select(path)}
              positions={tree.positions}
              onMove={tree.setPosition}
              onResetPositions={tree.resetPositions}
              canUndo={tree.canUndo}
              canRedo={tree.canRedo}
              onUndo={() => {
                tree.undo()
                flash({ kind: 'info', text: (m) => m.undone })
              }}
              onRedo={() => {
                tree.redo()
                flash({ kind: 'info', text: (m) => m.redone })
              }}
              renderedKeys={render?.rendered ?? new Set<string>()}
              lastRendered={render?.last ?? null}
              footer={footer}
            />
          </motion.section>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
        <div className="pointer-events-auto">
          <StatusMessage status={status} t={t} />
        </div>
      </div>

      <NameDialog
        key={dialog ?? 'none'}
        open={dialog === 'sibling' || dialog === 'child' || dialog === 'rename' || dialog === 'savePreset'}
        title={dialogTitle}
        initialValue={dialog === 'rename' ? tree.selectedNode?.name ?? '' : ''}
        t={t}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'remove'}
        message={t.dialogConfirmRemove(tree.selectedNode?.name ?? '')}
        confirmLabel={t.removeAction}
        t={t}
        onConfirm={handleRemove}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'exists'}
        title={t.existsTitle(sanitizeName(projectName))}
        message={t.existsMessage}
        confirmLabel={t.renderAnyway}
        tone="accent"
        t={t}
        onConfirm={() => {
          setDialog(null)
          const name = sanitizeName(projectName)
          if (dirHandle && name) void runRender(name, dirHandle)
        }}
        onClose={() => setDialog(null)}
      />

      <AnimatePresence>{booting && <Splash title={t.title} caption={t.booting} />}</AnimatePresence>
    </div>
  )
}
