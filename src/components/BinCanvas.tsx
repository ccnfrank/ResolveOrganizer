import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Clapperboard, Folder, FolderOpen, LayoutGrid, Maximize2, Plus, Redo2, Undo2 } from 'lucide-react'
import { canReparent, type BinNode, type Path } from '../lib/binTree'
import { layoutTree, pathKey, ROOT_KEY, type LayoutItem, type LayoutMode, type Point, type Positions } from '../lib/layout'
import type { Messages } from '../i18n/messages'
import { SliderField } from './SliderField'

const NODE_HEIGHT = 50
const GAP_Y = 10
const MIN_ZOOM = 0.5
const MAX_ZOOM = 1.4
/** The graph opens at this zoom, or narrower if the panel cannot hold it. */
const DEFAULT_ZOOM = 0.75
const DEFAULT_SPACING = 32
const NARROW_BELOW = 560
const DRAG_THRESHOLD_PX = 4
const EASE = [0.16, 1, 0.3, 1] as const
/** Breathing room between the graph and the panel edges, in layout pixels. */
const PAD = 28
/** Follow the pointer with a short glide, so a drag reads as one continuous movement. */
const FOLLOW = { duration: 0.18, ease: EASE } as const
/** Settle into an automatic position after a reflow or a drop. */
const SETTLE = { duration: 0.5, ease: EASE } as const
/** The lift when a bin is grabbed, and the return when it is dropped. */
const LIFT = { type: 'spring', stiffness: 380, damping: 30 } as const
/** The empty selection. One shared instance, so clearing it does not re-render. */
const NO_GROUP: ReadonlySet<string> = new Set<string>()

type BinCanvasProps = {
  t: Messages
  rootLabel: string
  nodes: BinNode[]
  selected: Path | null
  onSelect: (path: Path) => void
  positions: Positions
  /** Stores the new positions of one or more bins as a single undoable step. */
  onMoveMany: (points: Record<string, Point>) => void
  /** Nests the bin at the first path under the bin at the second (null: the project root). */
  onReparent: (from: Path, to: Path | null) => void
  /** Opens the add dialog for a sub-bin of the bin at `path`; null adds a top-level bin. */
  onAddSub: (path: Path | null) => void
  /** Opens the rename dialog for the bin at `path` (double-click on a bin). */
  onRename: (path: Path) => void
  /** Double-click on the project root: the project name is edited in the form. */
  onRenameRoot: () => void
  onResetPositions: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  /** Keys of bins already rendered during a render run; empty outside one. */
  renderedKeys: ReadonlySet<string>
  /** The bin rendered most recently, flashed with a ping. */
  lastRendered: string | null
  footer: ReactNode
}

type DragMember = { id: string; originX: number; originY: number }

type DragState = {
  /** The bin the pointer pressed. */
  id: string
  /** Null for the project root, which can be moved but not nested. */
  path: Path | null
  pointerId: number
  startX: number
  startY: number
  moved: boolean
  /** Every bin that moves with this press: the selection when the press is on it, else the bin alone. */
  members: DragMember[]
}

/** The rectangle of a Shift + drag on the background, in content pixels. */
type Marquee = { pointerId: number; x0: number; y0: number; x1: number; y1: number }

/** The bin a dragged bin would be nested under. `path` is null for the project root. */
type DropTarget = { key: string; path: Path | null }

/**
 * Ring shown on the bin a dragged bin would land in. Wider than the dragged bin's 3% lift, so it
 * stays visible around the bin that is covering it.
 */
const DROP_RING = 'shadow-[0_0_0_9px_color-mix(in_oklab,var(--color-steel)_24%,transparent)]'

/**
 * The bin under the centre of a dragged bin, if dropping there would nest it. Positions are in
 * layout pixels; `point` is where the dragged bin's top-left corner would sit.
 */
function findDropTarget(
  items: LayoutItem[],
  dragged: { id: string; path: Path },
  point: Point,
  size: { width: number; height: number },
): DropTarget | null {
  const cx = point.x + size.width / 2
  const cy = point.y + size.height / 2
  for (const item of items) {
    // A loose bin cannot take children: only connected bins and the root are drop targets.
    if (item.id === dragged.id || item.loose) continue
    const inside = cx >= item.x && cx <= item.x + item.width && cy >= item.y && cy <= item.y + item.height
    if (inside && canReparent(dragged.path, item.path)) return { key: item.key, path: item.path }
  }
  return null
}

/**
 * The "+" inside a bin. It sits beside the name and never starts a drag: its pointer-down stops
 * here, so a bin's own drag handlers (on the parent) do not see it.
 */
function AddSubButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onClick={onClick}
      className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md border border-edge bg-ground text-dim transition duration-200 hover:border-steel hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Plus size={13} aria-hidden="true" />
    </button>
  )
}

function RootNode({
  item,
  rendered,
  dragging,
  dropTarget,
  draggable,
  addLabel,
  onAddSub,
  onRenameRoot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  item: LayoutItem
  rendered: boolean
  dragging: boolean
  dropTarget: boolean
  draggable: boolean
  addLabel: string
  onAddSub: (path: Path | null) => void
  onRenameRoot: () => void
  onPointerDown: (event: PointerEvent<HTMLDivElement>, item: LayoutItem) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <motion.div
      data-bin=""
      onDoubleClick={onRenameRoot}
      onPointerDown={(event) => onPointerDown(event, item)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      animate={{ x: item.x, y: item.y, scale: dragging ? 1.03 : 1 }}
      transition={{ x: dragging ? FOLLOW : SETTLE, y: dragging ? FOLLOW : SETTLE, scale: LIFT }}
      style={{ left: 0, top: 0, width: item.width, height: item.height, touchAction: 'none' }}
      className={`absolute flex select-none items-center gap-2.5 rounded-xl border bg-raised pl-3.5 pr-10 transition-[border-color,box-shadow] duration-200 ${
        dropTarget ? `border-steel ${DROP_RING}` : 'border-accent/45'
      } ${
        draggable ? (dragging ? 'z-10 cursor-grabbing shadow-[0_16px_32px_-14px_rgb(0_0_0/0.8)]' : 'cursor-grab') : ''
      }`}
    >
      <Clapperboard size={18} aria-hidden="true" className="shrink-0 text-accent" />
      <span className="min-w-0 truncate text-[17px] font-semibold text-fg">{item.name}</span>
      {rendered && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-steel" />}
      <AddSubButton label={addLabel} onClick={() => onAddSub(null)} />
    </motion.div>
  )
}

function BinNodeButton({
  item,
  isSelected,
  inGroup,
  rendered,
  justRendered,
  dragging,
  dropTarget,
  draggable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClickNode,
  addLabel,
  onAddSub,
  onRename,
}: {
  item: LayoutItem
  isSelected: boolean
  /** Part of the multi-selection (Shift + click, or a marquee). */
  inGroup: boolean
  rendered: boolean
  justRendered: boolean
  dragging: boolean
  dropTarget: boolean
  draggable: boolean
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, item: LayoutItem) => void
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void
  onClickNode: (item: LayoutItem, additive: boolean) => void
  addLabel: string
  onAddSub: (path: Path | null) => void
  onRename: (path: Path) => void
}) {
  if (!item.path) return null
  const path = item.path
  const Icon = isSelected ? FolderOpen : Folder

  return (
    // The wrapper carries the position and the entrance; the "+" is its sibling, so it is not
    // nested inside the bin's button.
    <motion.div
      data-bin=""
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: dragging ? 1.03 : 1, x: item.x, y: item.y }}
      transition={{
        opacity: { duration: 0.3, delay: item.order * 0.03 },
        scale: dragging ? LIFT : { ...LIFT, delay: item.order * 0.03 },
        x: dragging ? FOLLOW : SETTLE,
        y: dragging ? FOLLOW : SETTLE,
      }}
      style={{ left: 0, top: 0, width: item.width, height: item.height }}
      className={`absolute ${dragging ? 'z-10' : ''}`}
    >
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={(event) => onClickNode(item, event.shiftKey || event.metaKey || event.ctrlKey)}
        onDoubleClick={() => onRename(path)}
        onPointerDown={(event) => onPointerDown(event, item)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none' }}
        className={`relative flex h-full w-full select-none items-center gap-2.5 rounded-xl border pl-3 pr-10 text-left text-[13.5px] outline-none transition-[border-color,background-color,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          draggable ? (dragging ? 'cursor-grabbing z-10' : 'cursor-grab') : 'cursor-pointer'
        } ${
          dropTarget
            ? `border-steel bg-raised text-fg ${DROP_RING}`
            : isSelected
              ? 'border-steel bg-raised text-fg shadow-[0_0_0_1px_var(--color-steel),0_16px_32px_-16px_rgb(0_0_0/0.8)]'
              : inGroup
                ? 'border-steel/70 bg-raised text-fg'
                : `border-edge bg-surface text-fg/90 hover:border-dim/50 hover:text-fg ${item.loose ? 'border-dashed' : ''} ${dragging ? 'shadow-[0_16px_32px_-14px_rgb(0_0_0/0.8)]' : ''}`
        }`}
      >
        <Icon size={16} aria-hidden="true" className={`shrink-0 ${isSelected ? 'text-steel' : 'text-accent'}`} />
        <span className="min-w-0 flex-1 truncate font-medium">
          {item.name}
          <span className="text-dim">/</span>
        </span>
        {item.childCount > 0 && (
          <span className="shrink-0 rounded-md bg-ground px-1.5 py-0.5 font-mono text-[11px] num text-dim">
            {item.childCount}
          </span>
        )}
        {rendered && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-steel" />
        )}
        {justRendered && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 animate-ping rounded-full bg-accent" />
        )}
      </button>
      <AddSubButton label={addLabel} onClick={() => onAddSub(path)} />
    </motion.div>
  )
}

/** Levels of bins below the project root; 0 when there are none. */
function depthOf(nodes: BinNode[]): number {
  return nodes.reduce((deepest, node) => Math.max(deepest, 1 + depthOf(node.children ?? [])), 0)
}

/**
 * The bin graph panel. Wide screens draw a node graph where bins can be dragged; narrow screens
 * switch to an indented list. Manual positions are kept per bin and can be undone.
 */
export function BinCanvas({
  t,
  rootLabel,
  nodes,
  selected,
  onSelect,
  positions,
  onMoveMany,
  onResetPositions,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  renderedKeys,
  lastRendered,
  footer,
  onReparent,
  onAddSub,
  onRename,
  onRenameRoot,
}: BinCanvasProps) {
  const [zoom, setZoom] = useState<number | null>(null)
  const [spacing, setSpacing] = useState(DEFAULT_SPACING)
  const [viewportWidth, setViewportWidth] = useState(0)
  /** Layout positions of the bins being dragged, by id. */
  const [live, setLive] = useState<Record<string, Point> | null>(null)
  const [dropKey, setDropKey] = useState<string | null>(null)
  /** The multi-selection: bins that move together. Empty when nothing is grouped. */
  const [group, setGroup] = useState<ReadonlySet<string>>(NO_GROUP)
  const [marquee, setMarquee] = useState<Marquee | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const sizerRef = useRef<HTMLDivElement>(null)
  const pan = useRef<{ pointerId: number; x: number; y: number; left: number; top: number } | null>(null)
  const [panning, setPanning] = useState(false)
  const marqueeRef = useRef<Marquee | null>(null)
  const drag = useRef<DragState | null>(null)
  const liveRef = useRef<Record<string, Point> | null>(null)
  const dropRef = useRef<DropTarget | null>(null)
  const suppressClick = useRef(false)

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const measure = () => setViewportWidth(element.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const mode: LayoutMode = viewportWidth > 0 && viewportWidth < NARROW_BELOW ? 'list' : 'graph'
  const step = mode === 'graph' ? 24 + spacing : 12 + Math.round(spacing * 0.3)
  // List mode: the deepest bin is indented by `treeDepth` steps, so the rows must leave room for it.
  const treeDepth = useMemo(() => depthOf(nodes), [nodes])
  const nodeWidth =
    mode === 'graph' ? 188 : Math.max(168, Math.min(280, viewportWidth - 2 * PAD - treeDepth * step))

  // While bins are being dragged, their live positions override the stored ones.
  const effectivePositions = useMemo<Positions>(() => (live ? { ...positions, ...live } : positions), [positions, live])

  const layout = useMemo(
    () =>
      layoutTree(rootLabel, nodes, {
        mode,
        nodeWidth,
        nodeHeight: NODE_HEIGHT,
        gapY: GAP_Y,
        step,
        positions: effectivePositions,
      }),
    [rootLabel, nodes, mode, nodeWidth, step, effectivePositions],
  )

  // The width that fits the panel, minus the padding on both sides. "Fit" sets the zoom to it; until
  // the user zooms, the graph opens at DEFAULT_ZOOM or at the fitting width, whichever is smaller.
  const fit = mode === 'graph' && viewportWidth > 0 ? (viewportWidth - 2 * PAD) / layout.width : 1
  const fitZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fit))
  const effective = zoom ?? (mode === 'graph' ? Math.min(DEFAULT_ZOOM, fitZoom) : 1)
  const zoomPercent = Math.round(effective * 100)
  const draggable = mode === 'graph'

  const orderOf = useMemo(() => new Map(layout.items.map((item) => [item.key, item.order])), [layout])

  // Bins on the path from the root to the selection: their edges glow.
  const onPath = useMemo(() => {
    const keys = new Set<string>([ROOT_KEY])
    if (selected) selected.forEach((_, index) => keys.add(pathKey(selected.slice(0, index + 1))))
    return keys
  }, [selected])

  const selectedKey = selected ? pathKey(selected) : null
  const hasManualPositions = Object.keys(positions).length > 0
  const isLive = (id: string) => live !== null && id in live

  const onNodePointerDown = (event: PointerEvent<HTMLElement>, item: LayoutItem) => {
    if (!draggable || event.button !== 0) return
    // Pressing a bin of the selection moves the whole selection; any other bin moves alone.
    const members =
      group.has(item.id) && group.size > 1
        ? layout.items
            .filter((other) => group.has(other.id) && other.path !== null)
            .map((other) => ({ id: other.id, originX: other.x, originY: other.y }))
        : [{ id: item.id, originX: item.x, originY: item.y }]
    drag.current = {
      id: item.id,
      path: item.path,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      members,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onNodePointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY)
    if (!current.moved && distance < DRAG_THRESHOLD_PX) return
    if (!current.moved && !group.has(current.id)) setGroup(NO_GROUP)
    current.moved = true
    // The graph is scaled, so a screen pixel is 1 / zoom layout pixels.
    const dx = (event.clientX - current.startX) / effective
    const dy = (event.clientY - current.startY) / effective
    const points: Record<string, Point> = {}
    for (const member of current.members) {
      points[member.id] = { x: Math.max(0, member.originX + dx), y: Math.max(0, member.originY + dy) }
    }
    liveRef.current = points
    setLive(points)

    // Nesting is for one bin at a time: a group only moves.
    const single = current.members.length === 1 ? points[current.id] : undefined
    const target =
      single && current.path
        ? findDropTarget(layout.items, { id: current.id, path: current.path }, single, {
            width: nodeWidth,
            height: NODE_HEIGHT,
          })
        : null
    dropRef.current = target
    setDropKey(target?.key ?? null)
  }

  const onNodePointerUp = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (current.moved && liveRef.current) {
      suppressClick.current = true
      const target = dropRef.current
      if (current.members.length === 1 && current.path && target) onReparent(current.path, target.path)
      else onMoveMany(liveRef.current)
    }
    liveRef.current = null
    dropRef.current = null
    setDropKey(null)
    setLive(null)
  }

  /** A point in the graph's own pixels, measured from the top-left of the scrollable area's content. */
  const contentPoint = (clientX: number, clientY: number): Point => {
    const rect = sizerRef.current?.getBoundingClientRect()
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) }
  }

  /** The bins a marquee rectangle touches. The project root is never part of a selection. */
  const binsInside = (rect: Marquee): Set<string> => {
    const left = (Math.min(rect.x0, rect.x1) - PAD) / effective
    const right = (Math.max(rect.x0, rect.x1) - PAD) / effective
    const top = (Math.min(rect.y0, rect.y1) - PAD) / effective
    const bottom = (Math.max(rect.y0, rect.y1) - PAD) / effective
    return new Set(
      layout.items
        .filter(
          (item) =>
            item.path !== null &&
            item.x < right &&
            item.x + item.width > left &&
            item.y < bottom &&
            item.y + item.height > top,
        )
        .map((item) => item.id),
    )
  }

  /**
   * Dragging the empty canvas pans it, like a hand on paper. Shift + dragging it draws a rectangle
   * that selects the bins it touches. Presses that start on a bin are left to the bin's own drag.
   */
  const onViewportPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const element = viewportRef.current
    if (!element || event.button !== 0) return
    if ((event.target as Element).closest('[data-bin]')) return
    if (event.shiftKey && draggable) {
      const start = contentPoint(event.clientX, event.clientY)
      const rect = { pointerId: event.pointerId, x0: start.x, y0: start.y, x1: start.x, y1: start.y }
      marqueeRef.current = rect
      setMarquee(rect)
      element.setPointerCapture?.(event.pointerId)
      return
    }
    setGroup(NO_GROUP)
    pan.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    }
    element.setPointerCapture?.(event.pointerId)
    setPanning(true)
  }

  const onViewportPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const area = marqueeRef.current
    if (area && area.pointerId === event.pointerId) {
      const point = contentPoint(event.clientX, event.clientY)
      const next = { ...area, x1: point.x, y1: point.y }
      marqueeRef.current = next
      setMarquee(next)
      return
    }
    const current = pan.current
    const element = viewportRef.current
    if (!current || !element || current.pointerId !== event.pointerId) return
    element.scrollLeft = current.left - (event.clientX - current.x)
    element.scrollTop = current.top - (event.clientY - current.y)
  }

  const endPan = (event: PointerEvent<HTMLDivElement>) => {
    const area = marqueeRef.current
    if (area && area.pointerId === event.pointerId) {
      marqueeRef.current = null
      setMarquee(null)
      setGroup(new Set(binsInside(area)))
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      return
    }
    const current = pan.current
    if (!current || current.pointerId !== event.pointerId) return
    pan.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setPanning(false)
  }

  /** Shift, Cmd or Ctrl + click adds or removes a bin from the selection; a plain click selects it alone. */
  const onNodeClick = (item: LayoutItem, additive: boolean) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (additive) {
      setGroup((previous) => {
        const next = new Set(previous)
        if (next.has(item.id)) next.delete(item.id)
        else next.add(item.id)
        return next
      })
      return
    }
    // A plain click starts a new selection that holds the clicked bin, so Shift + click can add to it.
    setGroup(item.path ? new Set([item.id]) : NO_GROUP)
    if (item.path) onSelect(item.path)
  }

  const marqueeBox = marquee
    ? {
        left: Math.min(marquee.x0, marquee.x1),
        top: Math.min(marquee.y0, marquee.y1),
        width: Math.abs(marquee.x1 - marquee.x0),
        height: Math.abs(marquee.y1 - marquee.y0),
      }
    : null

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 border-b border-edge px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="sr-only">{t.structure}</h2>
        </div>

        <div className="flex w-full flex-wrap items-end gap-x-5 gap-y-4 sm:w-auto">
          <SliderField
            label={t.zoom}
            value={zoomPercent}
            min={Math.round(MIN_ZOOM * 100)}
            max={Math.round(MAX_ZOOM * 100)}
            step={1}
            display={`${zoomPercent}%`}
            onChange={(next) => setZoom(next / 100)}
          />
          <SliderField
            label={t.spacing}
            value={spacing}
            min={0}
            max={100}
            step={1}
            display={`${step}px`}
            onChange={setSpacing}
          />
          <div className="flex items-center gap-1">
            <CanvasTool label={t.undo} icon={Undo2} disabled={!canUndo} onClick={onUndo} />
            <CanvasTool label={t.redo} icon={Redo2} disabled={!canRedo} onClick={onRedo} />
            <CanvasTool
              label={t.autoArrange}
              icon={LayoutGrid}
              disabled={!hasManualPositions}
              onClick={onResetPositions}
            />
            <CanvasTool
              label={t.fit}
              icon={Maximize2}
              disabled={mode !== 'graph'}
              onClick={() => setZoom(fitZoom)}
            />
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        className={`thin-scroll relative h-[min(72vh,740px)] min-h-[480px] select-none overflow-auto ${
          panning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          ref={sizerRef}
          className="relative"
          style={{ width: layout.width * effective + 2 * PAD, height: layout.height * effective + 2 * PAD }}
        >
          <div
            className="absolute origin-top-left"
            style={{ left: PAD, top: PAD, width: layout.width, height: layout.height, transform: `scale(${effective})` }}
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width={layout.width}
              height={layout.height}
            >
              {layout.edges.map((edge) => {
                const lit = onPath.has(edge.to)
                return (
                  <motion.path
                    key={`${edge.from}-${edge.to}`}
                    fill="none"
                    strokeWidth={lit ? 1.75 : 1.25}
                    style={{
                      stroke: lit ? 'var(--color-steel)' : 'color-mix(in oklab, var(--color-dim) 38%, transparent)',
                    }}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1, d: edge.d }}
                    transition={{
                      pathLength: { duration: 0.5, delay: (orderOf.get(edge.to) ?? 0) * 0.03 },
                      d: live ? FOLLOW : SETTLE,
                    }}
                  />
                )
              })}
            </svg>

            {layout.items.map((item) =>
              item.path === null ? (
                <RootNode
                  key={item.key}
                  item={item}
                  rendered={renderedKeys.has(item.key)}
                  dragging={isLive(item.id)}
                  dropTarget={dropKey === item.key}
                  draggable={draggable}
                  addLabel={t.addSubBin}
                  onAddSub={onAddSub}
                  onRenameRoot={onRenameRoot}
                  onPointerDown={onNodePointerDown}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={onNodePointerUp}
                />
              ) : (
                <BinNodeButton
                  key={item.key}
                  item={item}
                  isSelected={item.key === selectedKey}
                  inGroup={group.has(item.id)}
                  rendered={renderedKeys.has(item.key)}
                  justRendered={item.key === lastRendered}
                  dragging={isLive(item.id)}
                  dropTarget={dropKey === item.key}
                  draggable={draggable}
                  onPointerDown={onNodePointerDown}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={onNodePointerUp}
                  onClickNode={onNodeClick}
                  addLabel={t.addSubBin}
                  onAddSub={onAddSub}
                  onRename={onRename}
                />
              ),
            )}

            {nodes.length === 0 && (
              <p className="absolute text-sm text-dim" style={{ left: 0, top: layout.items[0].height + 24 }}>
                {t.emptyGraph}
              </p>
            )}
          </div>

          {marqueeBox && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-md border border-steel/70 bg-steel/10"
              style={marqueeBox}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 border-t border-edge px-5 py-5 sm:px-6">
        {footer}
      </div>
    </div>
  )
}

function CanvasTool({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string
  icon: typeof Undo2
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-lg border border-edge text-dim transition duration-200 hover:border-dim/50 hover:text-fg disabled:opacity-35"
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  )
}
