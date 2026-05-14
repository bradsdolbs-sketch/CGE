import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Sanitise — no path traversal
  const filename = params.filename.replace(/[^a-zA-Z0-9_.-]/g, '')
  const storagePath = `reports/${filename}`

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data } = supabase.storage.from('uploads').getPublicUrl(storagePath)
  return NextResponse.redirect(data.publicUrl)
}
