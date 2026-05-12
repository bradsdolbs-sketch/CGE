import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/upload'

export const dynamic = 'force-dynamic'

const SHARE_CODE_REGEX = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id } })
  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const formData = await req.formData()
  const checkDate = formData.get('checkDate') as string
  const documentType = formData.get('documentType') as string
  const expiryDate = formData.get('expiryDate') as string | null
  const checkedBy = formData.get('checkedBy') as string | null
  const notes = formData.get('notes') as string | null
  const file = formData.get('document') as File | null
  const checkType = (formData.get('checkType') as string | null) ?? 'MANUAL_DOCUMENT'
  const shareCode = formData.get('shareCode') as string | null
  const tenantDob = formData.get('tenantDob') as string | null

  if (!checkDate || !documentType) {
    return NextResponse.json({ error: 'checkDate and documentType are required' }, { status: 400 })
  }

  if (checkType === 'GOV_UK_SHARE_CODE') {
    if (!shareCode || !SHARE_CODE_REGEX.test(shareCode)) {
      return NextResponse.json({ error: 'Valid share code required (format: XXXXX-XXXXX-XXXXX)' }, { status: 400 })
    }
    if (!tenantDob) {
      return NextResponse.json({ error: 'Tenant date of birth required for GOV.UK share code check' }, { status: 400 })
    }
  }

  let documentUrl: string | null = null
  if (file && file.size > 0) {
    documentUrl = await saveFile(file, 'rtr-documents')
  }

  const check = await prisma.rightToRentCheck.create({
    data: {
      tenantId: params.id,
      checkDate: new Date(checkDate),
      documentType,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      checkedBy: checkedBy || null,
      notes: notes || null,
      documentUrl,
      checkType: checkType as 'MANUAL_DOCUMENT' | 'GOV_UK_SHARE_CODE',
      shareCode: shareCode?.toUpperCase() || null,
      tenantDob: tenantDob || null,
      verified: checkType === 'MANUAL_DOCUMENT', // manual docs are verified at point of recording
      verifiedAt: checkType === 'MANUAL_DOCUMENT' ? new Date() : null,
      verifiedBy: checkType === 'MANUAL_DOCUMENT' ? (checkedBy || null) : null,
    },
  })

  return NextResponse.json(check, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN', 'AGENT'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { checkId, verifiedBy } = await req.json()
  if (!checkId || !verifiedBy) {
    return NextResponse.json({ error: 'checkId and verifiedBy required' }, { status: 400 })
  }

  const check = await prisma.rightToRentCheck.findUnique({ where: { id: checkId } })
  if (!check || check.tenantId !== params.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.rightToRentCheck.update({
    where: { id: checkId },
    data: { verified: true, verifiedAt: new Date(), verifiedBy },
  })

  return NextResponse.json(updated)
}
