/**
 * Client-safe helper — no Node.js imports.
 * Converts a stored file path to a public-facing URL.
 */
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL ?? '/uploads'

export function getFileUrl(storedPath: string): string {
  if (!storedPath) return ''
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
    return storedPath
  }
  const base = UPLOAD_URL.replace(/\/$/, '')
  const relative = storedPath.startsWith('/') ? storedPath : `/${storedPath}`
  return `${base}${relative}`
}
