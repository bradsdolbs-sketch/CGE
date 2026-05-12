import { createClient } from '@supabase/supabase-js'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'uploads'

/**
 * Save a File object to Supabase Storage.
 * Returns the public CDN URL.
 */
export async function saveFile(file: File, subdir: string): Promise<string> {
  const ext = path.extname(file.name).toLowerCase()
  const safeName = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60)
  const filename = `${subdir}/${Date.now()}_${safeName}${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

/**
 * Delete a file given its public Supabase Storage URL.
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  if (!publicUrl) return

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`

  if (!publicUrl.startsWith(storagePrefix)) return

  const storagePath = publicUrl.slice(storagePrefix.length)

  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw new Error(`Delete failed: ${error.message}`)
}

/**
 * Return the public URL for a stored path — already a full URL from Supabase.
 */
export function getFileUrl(storedPath: string): string {
  return storedPath ?? ''
}
