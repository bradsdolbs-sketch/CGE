import fs from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL ?? '/uploads'

/**
 * Save a File object to disk.
 * Returns the public-facing path (e.g. /uploads/properties/abc123.jpg)
 */
export async function saveFile(file: File, subdir: string): Promise<string> {
  const targetDir = path.join(UPLOAD_DIR, subdir)

  // Ensure directory exists
  await fs.mkdir(targetDir, { recursive: true })

  // Build a unique filename: timestamp + original name (sanitised)
  const ext = path.extname(file.name).toLowerCase()
  const safeName = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60)
  const filename = `${Date.now()}_${safeName}${ext}`
  const filePath = path.join(targetDir, filename)

  // Write file
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fs.writeFile(filePath, buffer)

  // Return the public path
  return `/${subdir}/${filename}`
}

/**
 * Delete a file given its public path (e.g. /uploads/properties/abc.jpg)
 * Strips the leading /uploads prefix and resolves to the filesystem path.
 */
export async function deleteFile(publicPath: string): Promise<void> {
  // Strip the leading URL prefix to get the relative subpath
  let relative = publicPath
  if (relative.startsWith(UPLOAD_URL)) {
    relative = relative.slice(UPLOAD_URL.length)
  }
  // Remove any leading slash
  relative = relative.replace(/^\/+/, '')

  const filePath = path.join(UPLOAD_DIR, relative)

  // Only delete if the file is within the UPLOAD_DIR (security check)
  const resolved = path.resolve(filePath)
  const uploadResolved = path.resolve(UPLOAD_DIR)
  if (!resolved.startsWith(uploadResolved)) {
    throw new Error('Path traversal detected — refusing to delete file outside upload directory')
  }

  if (existsSync(resolved)) {
    await fs.unlink(resolved)
  }
}

/**
 * Return the full public URL for a stored file path.
 */
export function getFileUrl(storedPath: string): string {
  if (!storedPath) return ''
  // If already absolute URL, return as-is
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
    return storedPath
  }
  const base = UPLOAD_URL.replace(/\/$/, '')
  const relative = storedPath.startsWith('/') ? storedPath : `/${storedPath}`
  return `${base}${relative}`
}
