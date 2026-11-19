import type { BinNode, Path } from '../lib/binTree'

type BinTreeProps = {
  nodes: BinNode[]
  selected: Path | null
  onSelect: (path: Path) => void
  prefix?: Path
  nested?: boolean
}

function isSame(a: Path | null, b: Path): boolean {
  return !!a && a.length === b.length && a.every((value, i) => value === b[i])
}

/**
 * Folder tree drawn with real connector lines. The line structure is the hierarchy:
 * each child hangs from a vertical rule on its parent, and the selected row has an accent rail.
 */
export function BinTree({ nodes, selected, onSelect, prefix = [], nested = false }: BinTreeProps) {
  return (
    <ul
      className={
        nested
          ? 'ml-3 grid gap-0.5 border-l border-line pl-4'
          : 'grid gap-0.5'
      }
    >
      {nodes.map((node, index) => {
        const path = [...prefix, index]
        const active = isSame(selected, path)
        return (
          <li
            key={path.join('.')}
            className={nested ? "relative before:absolute before:-left-4 before:top-1/2 before:h-px before:w-3 before:bg-line before:content-['']" : 'relative'}
          >
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(path)}
              className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-left sm:min-h-0 sm:py-1.5 font-mono text-[0.85rem] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? 'bg-accent/10 text-text shadow-[inset_2px_0_0_var(--color-accent)]'
                  : 'text-text/80 hover:bg-white/[0.04] hover:text-text'
              }`}
            >
              <span className={`truncate ${active ? 'text-text' : ''}`}>{node.name}/</span>
              {node.children?.length ? (
                <span className="ml-auto shrink-0 text-[0.7rem] tabular-nums text-muted">{node.children.length}</span>
              ) : null}
            </button>
            {node.children?.length ? (
              <BinTree
                nodes={node.children}
                selected={selected}
                onSelect={onSelect}
                prefix={path}
                nested
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
