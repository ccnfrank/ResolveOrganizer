/**
 * Recent destination folders. The browser lets us store a FileSystemDirectoryHandle in IndexedDB,
 * so the next session can reuse the folder after a permission prompt, without a second picker.
 */

const DB_NAME = 'resolve-organizer'
const STORE = 'kv'
const KEY = 'recent-folders'
export const MAX_RECENT = 5

export type RecentFolder = { name: string; handle: FileSystemDirectoryHandle }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function write(list: RecentFolder[]): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(list, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadRecentFolders(): Promise<RecentFolder[]> {
  try {
    const db = await open()
    const list = await new Promise<RecentFolder[]>((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve((request.result as RecentFolder[] | undefined) ?? [])
      request.onerror = () => reject(request.error)
    })
    db.close()
    return list
  } catch {
    return []
  }
}

async function isSameFolder(a: FileSystemDirectoryHandle, b: FileSystemDirectoryHandle): Promise<boolean> {
  if (typeof a.isSameEntry === 'function') return a.isSameEntry(b)
  return a.name === b.name
}

/** Puts the folder at the top of the list, drops duplicates and keeps the newest MAX_RECENT. */
export async function rememberFolder(handle: FileSystemDirectoryHandle): Promise<RecentFolder[]> {
  const current = await loadRecentFolders()
  const others: RecentFolder[] = []
  for (const item of current) {
    if (!(await isSameFolder(item.handle, handle))) others.push(item)
  }
  const next = [{ name: handle.name, handle }, ...others].slice(0, MAX_RECENT)
  try {
    await write(next)
  } catch {
    // Without storage the folder still works for this session.
  }
  return next
}

type PermissionAware = FileSystemDirectoryHandle & {
  queryPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (options: { mode: 'readwrite' }) => Promise<PermissionState>
}

/** Asks for write access if the browser has not granted it in this session yet. */
export async function ensureWritable(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const aware = handle as PermissionAware
  const options = { mode: 'readwrite' as const }
  if ((await aware.queryPermission?.(options)) === 'granted') return true
  return (await aware.requestPermission?.(options)) === 'granted'
}
