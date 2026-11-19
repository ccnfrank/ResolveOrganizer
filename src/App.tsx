import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useBinTree } from './hooks/useBinTree'
import { useLanguage } from './i18n/useLanguage'
import { countFolders, getNode, type BinNode, type Path } from './lib/binTree'
import { createProjectTree, pickDirectory, supportsDirectoryPicker } from './lib/fileSystem'
import { sanitizeName } from './lib/sanitize'
import { BinToolbar } from './components/BinToolbar'
import { BinTree } from './components/BinTree'
import { ConfirmDialog } from './components/ConfirmDialog'
import { LanguageSwitch } from './components/LanguageSwitch'
import { NameDialog } from './components/NameDialog'
import { ProjectForm } from './components/ProjectForm'
import { StatusMessage, type Status } from './components/StatusMessage'
import type { Messages } from './i18n/messages'

type Dialog = 'sibling' | 'child' | 'rename' | 'remove' | null

const STATUS_TIMEOUT_MS = 3500

/** Folder names from the root down to `path`, used for the breadcrumb line. */
function pathNames(nodes: BinNode[], path: Path): string[] {
  return path.map((_, depth) => getNode(nodes, path.slice(0, depth + 1))?.name ?? '')
}

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const tree = useBinTree()

  const [projectName, setProjectName] = useState('')
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)

  const flash = useCallback((next: Status) => setStatus(next), [])

  // Success and info messages fade on their own; errors stay until the next action.
  useEffect(() => {
    if (!status || status.kind === 'error') return
    const timer = window.setTimeout(() => setStatus(null), STATUS_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  const previewRoot = sanitizeName(projectName) || t.projectPlaceholderRoot
  const folderTotal = countFolders(tree.nodes)

  const onSelectFolder = async () => {
    if (!supportsDirectoryPicker()) {
      flash({ kind: 'error', text: (m) => m.unsupported })
      return
    }
    try {
      const handle = await pickDirectory()
      if (handle) {
        setDirHandle(handle)
        flash({ kind: 'success', text: (m) => m.folderSelected(handle.name) })
      }
    } catch {
      flash({ kind: 'error', text: (m) => m.folderSelectError })
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
    setBusy(true)
    flash({ kind: 'info', text: (m) => m.creating })
    try {
      await createProjectTree(dirHandle, name, tree.nodes)
      setProjectName('')
      tree.select(null)
      flash({ kind: 'success', text: (m) => m.created(name) })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      flash({ kind: 'error', text: (m) => m.createError(message) })
    } finally {
      setBusy(false)
    }
  }

  const onReset = () => {
    setProjectName('')
    setDirHandle(null)
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

  const dialogTitle =
    dialog === 'child' ? t.dialogNewSub : dialog === 'rename' ? t.dialogRename : t.dialogNewBin

  const selectedPathLabel = tree.selected
    ? [previewRoot, ...pathNames(tree.nodes, tree.selected)].join('/') + '/'
    : `${previewRoot}/`

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-grid">
      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5"
        >
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-[1.7rem]">{t.title}</h1>
            <p className="mt-1 text-sm text-muted">{t.eyebrow}</p>
          </div>
          <LanguageSwitch lang={lang} t={t} onChange={setLang} />
        </motion.header>

        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead}</p>

        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg border border-line bg-panel p-5"
          >
            <ProjectForm
              t={t}
              projectName={projectName}
              destinationLabel={dirHandle?.name ?? t.noFolder}
              busy={busy}
              onProjectNameChange={setProjectName}
              onSelectFolder={onSelectFolder}
              onCreate={onCreate}
              onReset={onReset}
            />
            <div className="mt-5">
              <StatusMessage status={status} t={t} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="overflow-hidden rounded-lg border border-line bg-panel"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex min-w-0 items-baseline gap-3">
                <h2 className="text-sm font-semibold text-text">{t.structure}</h2>
                <span className="text-xs tabular-nums text-muted">{t.folderCount(folderTotal)}</span>
              </div>
              <BinToolbar
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

            <div className="p-3 sm:p-4">
              <p
                className="mb-3 truncate rounded-md bg-bg px-3 py-2 font-mono text-xs text-muted"
                title={selectedPathLabel}
              >
                {selectedPathLabel}
              </p>
              <div className="thin-scroll max-h-[60vh] overflow-auto pr-1">
                <div className="pl-1 font-mono text-[0.85rem] text-text">
                  <p className="mb-1 px-2.5 py-1.5 font-semibold">{previewRoot}/</p>
                  <BinTree
                    nodes={tree.nodes}
                    selected={tree.selected}
                    onSelect={(path: Path) => tree.select(path)}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <NameDialog
        key={dialog ?? 'none'}
        open={dialog === 'sibling' || dialog === 'child' || dialog === 'rename'}
        title={dialogTitle}
        initialValue={dialog === 'rename' ? tree.selectedNode?.name ?? '' : ''}
        t={t}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'remove'}
        message={t.dialogConfirmRemove(tree.selectedNode?.name ?? '')}
        t={t}
        onConfirm={handleRemove}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
