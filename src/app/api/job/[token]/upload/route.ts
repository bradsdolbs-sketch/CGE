import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/upload'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { contractorToken: params.token },
    select: { id: true, contractorTokenExpiry: true, contractorCompletedAt: true },
  })

  if (!request) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (request.contractorTokenExpiry && request.contractorTokenExpiry < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }
  if (request.contractorCompletedAt) {
    return NextResponse.json({ error: 'Job already completed' }, { status: 409 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 413 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const url = await saveFile(file, 'contractor-completions')
    return NextResponse.json({ url, name: file.name, size: file.size })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
