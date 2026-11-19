import { DEFAULT_STRUCTURE, cloneTree, countFolders, type BinNode } from './binTree'
import { sanitizeName } from './sanitize'

export type PresetId = 'default' | 'documentary' | 'commercial' | 'music-video'

export const BUILTIN_PRESETS: { id: PresetId; nodes: BinNode[] }[] = [
  { id: 'default', nodes: DEFAULT_STRUCTURE },
  {
    id: 'documentary',
    nodes: [
      { name: '00_Footage', children: [{ name: 'Entrevistas' }, { name: 'B-Roll' }, { name: 'Arquivo' }] },
      { name: '01_Proxy' },
      { name: '02_Audio', children: [{ name: 'Entrevistas' }, { name: 'Ambiente' }, { name: 'Narracao' }, { name: 'Trilha' }] },
      { name: '03_Graficos' },
      { name: '04_Pesquisa' },
      { name: '05_Exports' },
      { name: '06_Cache_Proxies' },
      { name: '07_Renders' },
    ],
  },
  {
    id: 'commercial',
    nodes: [
      { name: '00_Footage', children: [{ name: 'Set' }, { name: 'Produto' }, { name: 'Locacao' }] },
      { name: '01_Proxy' },
      { name: '02_Audio', children: [{ name: 'VO' }, { name: 'SFX' }, { name: 'Musica' }] },
      { name: '03_Graficos', children: [{ name: 'Logo' }, { name: 'Lower_Thirds' }] },
      { name: '04_Referencias' },
      { name: '05_Exports', children: [{ name: 'Versoes' }, { name: 'Entrega' }] },
      { name: '06_Cache_Proxies' },
      { name: '07_Renders' },
    ],
  },
  {
    id: 'music-video',
    nodes: [
      { name: '00_Footage', children: [{ name: 'Performance' }, { name: 'Cenas' }] },
      { name: '01_Proxy' },
      { name: '02_Audio', children: [{ name: 'Faixa_Mestre' }, { name: 'Stems' }] },
      { name: '03_Graficos' },
      { name: '04_Referencias' },
      { name: '05_Exports' },
      { name: '06_Cache_Proxies' },
      { name: '07_Renders' },
    ],
  },
]

export const PRESET_FORMAT = 'resolve-organizer-preset'
export const PRESET_VERSION = 1
export const MAX_PRESET_BINS = 300
export const MAX_PRESET_DEPTH = 6

const STORAGE_KEY = 'resolve-organizer-presets'

type SerialBin = { name: string; children?: SerialBin[] }

export type PresetFile = {
  format: typeof PRESET_FORMAT
  version: typeof PRESET_VERSION
  name: string
  bins: SerialBin[]
}

export type CustomPreset = { id: string; name: string; nodes: BinNode[] }

function toSerial(nodes: BinNode[]): SerialBin[] {
  return nodes.map((node) => ({
    name: node.name,
    ...(node.children?.length ? { children: toSerial(node.children) } : {}),
  }))
}

/** The JSON file a team can share. Ids are not part of it. */
export function serializePreset(name: string, nodes: BinNode[]): string {
  const file: PresetFile = {
    format: PRESET_FORMAT,
    version: PRESET_VERSION,
    name,
    bins: toSerial(nodes),
  }
  return JSON.stringify(file, null, 2)
}

export type ParseResult =
  | { ok: true; name: string; nodes: BinNode[] }
  | { ok: false; reason: 'invalid' | 'tooLarge' }

/** Validates an imported file. Names are sanitized the same way as typed names. */
export function parsePreset(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid' }
  const file = data as Partial<PresetFile>
  if (file.format !== PRESET_FORMAT || file.version !== PRESET_VERSION || !Array.isArray(file.bins)) {
    return { ok: false, reason: 'invalid' }
  }

  const convert = (bins: unknown[], depth: number): BinNode[] | null => {
    if (depth > MAX_PRESET_DEPTH) return null
    const result: BinNode[] = []
    for (const item of bins) {
      if (!item || typeof item !== 'object') return null
      const raw = (item as { name?: unknown }).name
      if (typeof raw !== 'string') return null
      const name = sanitizeName(raw)
      if (!name) return null
      const children = (item as { children?: unknown }).children
      if (children !== undefined && !Array.isArray(children)) return null
      const child = children ? convert(children, depth + 1) : []
      if (child === null) return null
      result.push(child.length ? { name, children: child } : { name })
    }
    return result
  }

  const nodes = convert(file.bins, 1)
  if (!nodes) return { ok: false, reason: 'invalid' }
  if (countFolders(nodes) > MAX_PRESET_BINS) return { ok: false, reason: 'tooLarge' }
  const name = sanitizeName(typeof file.name === 'string' ? file.name : '') || 'Imported'
  return { ok: true, name, nodes: cloneTree(nodes) }
}

export function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as CustomPreset[]
    return Array.isArray(list) ? list.filter((item) => item && typeof item.name === 'string') : []
  } catch {
    return []
  }
}

export function saveCustomPresets(list: CustomPreset[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Storage may be blocked; the presets then last for this session only.
  }
}
