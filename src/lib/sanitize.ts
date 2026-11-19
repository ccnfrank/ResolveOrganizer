/**
 * Turns user input into a safe folder name for macOS/Windows file systems.
 * Returns an empty string when nothing valid remains.
 */
export function sanitizeName(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim()
}
