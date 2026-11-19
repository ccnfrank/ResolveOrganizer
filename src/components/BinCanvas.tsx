import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Clapperboard, Folder, FolderOpen, LayoutGrid, Maximize2, Redo2, Undo2 } from 'lucide-react'
import type { BinNode, Path } from '../lib/binTree'
import { layoutTree, pathKey, ROOT_KEY, type LayoutItem, type LayoutMode, type Point, type Positions } from '../lib/layout'
import type { Messages } from '../i18n/messages'
import { SliderField } from './SliderField'

const NODE_HEIGHT = 50
const GAP_Y = 10
const MIN_ZOOM = 0.5
const MAX_ZOOM = 1.4
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

type BinCanvasProps = {
  t: Messages
  rootLabel: string
  nodes: BinNode[]
  selected: Path | null
  onSelect: (path: Path) => void
  positions: Positions
  onMove: (id: string, point: Point) => void
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

type DragState = {
  id: string
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

function RootNode({
  item,
  rendered,
  dragging,
  draggable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  item: LayoutItem
  rendered: boolean
  dragging: boolean
  draggable: boolean
  onPointerDown: (event: PointerEvent<HTMLDivElement>, item: LayoutItem) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <motion.div
      onPointerDown={(event) => onPointerDown(event, item)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      animate={{ x: item.x, y: item.y, scale: dragging ? 1.03 : 1 }}
      transition={{ x: dragging ? FOLLOW : SETTLE, y: dragging ? FOLLOW : SETTLE, scale: LIFT }}
      style={{ left: 0, top: 0, width: item.width, height: item.height, touchAction: 'none' }}
      className={`absolute flex select-none items-center gap-2.5 rounded-xl border border-accent/45 bg-raised px-3.5 ${
        draggable ? (dragging ? 'z-10 cursor-grabbing shadow-[0_16px_32px_-14px_rgb(0_0_0/0.8)]' : 'cursor-grab') : ''
      }`}
    >
      <Clapperboard size={18} aria-hidden="true" className="shrink-0 text-accent" />
      <span className="min-w-0 truncate text-[17px] font-semibold text-fg">{item.name}</span>
      {rendered && <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-steel" />}
    </motion.div>
  )
}

function BinNodeButton({
  item,
  isSelected,
  rendered,
  justRendered,
  dragging,
  draggable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClickNode,
}: {
  item: LayoutItem
  isSelected: boolean
  rendered: boolean
  justRendered: boolean
  dragging: boolean
  draggable: boolean
  onPointerDown: (event: PointerEvent<HTMLButtonElement>, item: LayoutItem) => void
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void
  onClickNode: (path: Path) => void
}) {
  if (!item.path) return null
  const path = item.path
  const Icon = isSelected ? FolderOpen : Folder

  return (
    <motion.button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onClickNode(path)}
      onPointerDown={(event) => onPointerDown(event, item)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: dragging ? 1.03 : 1, x: item.x, y: item.y }}
      transition={{
        opacity: { duration: 0.3, delay: item.order * 0.03 },
        scale: dragging ? LIFT : { ...LIFT, delay: item.order * 0.03 },
        x: dragging ? FOLLOW : SETTLE,
        y: dragging ? FOLLOW : SETTLE,
      }}
      style={{ left: 0, top: 0, width: item.width, height: item.height, touchAction: 'none' }}
      className={`absolute flex select-none items-center gap-2.5 rounded-xl border px-3 text-left text-[13.5px] outline-none transition-[border-color,background-color,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        draggable ? (dragging ? 'cursor-grabbing z-10' : 'cursor-grab') : 'cursor-pointer'
      } ${
        isSelected
          ? 'border-steel bg-raised text-fg shadow-[0_0_0_1px_var(--color-steel),0_16px_32px_-16px_rgb(0_0_0/0.8)]'
          : `border-edge bg-surface text-fg/90 hover:border-dim/50 hover:text-fg ${dragging ? 'shadow-[0_16px_32px_-14px_rgb(0_0_0/0.8)]' : ''}`
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
    </motion.button>
  )
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
  onMove,
  onResetPositions,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  renderedKeys,
  lastRendered,
  footer,
}: BinCanvasProps) {
  const [zoom, setZoom] = useState<number | null>(null)
  const [spacing, setSpacing] = useState(DEFAULT_SPACING)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)
  const liveRef = useRef<Point | null>(null)
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
  const nodeWidth = mode === 'graph' ? 188 : Math.max(168, Math.min(280, viewportWidth - 2 * step - 8))

  // While a bin is being dragged, its live position overrides the stored one.
  const effectivePositions = useMemo<Positions>(
    () => (live ? { ...positions, [live.id]: { x: live.x, y: live.y } } : positions),
    [positions, live],
  )

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

  // "Fit" shrinks the graph to the panel width, never above 100%; manual zoom overrides it.
  const fit = mode === 'graph' && viewportWidth > 0 ? viewportWidth / layout.width : 1
  const effective = zoom ?? (mode === 'graph' ? Math.min(1, Math.max(MIN_ZOOM, fit)) : 1)
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

  const onNodePointerDown = (event: PointerEvent<HTMLElement>, item: LayoutItem) => {
    if (!draggable || event.button !== 0) return
    drag.current = {
      id: item.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: item.x,
      originY: item.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const onNodePointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY)
    if (!current.moved && distance < DRAG_THRESHOLD_PX) return
    current.moved = true
    // The graph is scaled, so a screen pixel is 1 / zoom layout pixels.
    const point = {
      x: Math.max(0, current.originX + (event.clientX - current.startX) / effective),
      y: Math.max(0, current.originY + (event.clientY - current.startY) / effective),
    }
    liveRef.current = point
    setLive({ id: current.id, ...point })
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
      onMove(current.id, liveRef.current)
    }
    liveRef.current = null
    setLive(null)
  }

  const onNodeClick = (path: Path) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    onSelect(path)
  }

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
            <CanvasTool label={t.fit} icon={Maximize2} disabled={zoom === null} onClick={() => setZoom(null)} />
          </div>
        </div>
      </div>

      <div ref={viewportRef} className="thin-scroll relative h-[min(72vh,740px)] min-h-[480px] overflow-auto">
        <div
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
                  dragging={live?.id === item.id}
                  draggable={draggable}
                  onPointerDown={onNodePointerDown}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={onNodePointerUp}
                />
              ) : (
                <BinNodeButton
                  key={item.key}
                  item={item}
                  isSelected={item.key === selectedKey}
                  rendered={renderedKeys.has(item.key)}
                  justRendered={item.key === lastRendered}
                  dragging={live?.id === item.id}
                  draggable={draggable}
                  onPointerDown={onNodePointerDown}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={onNodePointerUp}
                  onClickNode={onNodeClick}
                />
              ),
            )}

            {nodes.length === 0 && (
              <p className="absolute text-sm text-dim" style={{ left: 0, top: layout.items[0].height + 24 }}>
                {t.emptyGraph}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-edge px-5 py-5 sm:px-6">
        {footer}
        {draggable && <p className="text-xs text-dim">{t.dragHint}</p>}
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
