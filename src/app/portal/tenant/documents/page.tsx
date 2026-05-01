import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { FileText, Download } from 'lucide-react'
import TenantDocumentUpload from '@/components/portal/TenantDocumentUpload'

type DocType = string

const TENANCY_DOC_TYPES: DocType[] = [
  'AST',
  'INVENTORY',
  'CHECK_IN_REPORT',
  'CHECK_OUT_REPORT',
  'DEPOSIT_RECEIPT',
  'RENEWAL_LETTER',
  'SECTION_21',
  'SECTION_8',
  'RENT_INCREASE',
]

const MY_DOC_TYPES: DocType[] = [
  'ID_DOCUMENT',
  'PROOF_OF_ADDRESS',
  'PAYSLIP',
  'REFERENCE',
  'REFERENCE_REQUEST',
  'OTHER',
]

const TYPE_LABEL: Record<string, string> = {
  AST: 'Tenancy Agreement',
  INVENTORY: 'Inventory',
  CHECK_IN_REPORT: 'Check-In Report',
  CHECK_OUT_REPORT: 'Check-Out Report',
  DEPOSIT_RECEIPT: 'Deposit Receipt',
  RENEWAL_LETTER: 'Renewal Letter',
  SECTION_21: 'Section 21 Notice',
  SECTION_8: 'Section 8 Notice',
  RENT_INCREASE: 'Rent Increase Notice',
  ID_DOCUMENT: 'ID Document',
  PROOF_OF_ADDRESS: 'Proof of Address',
  PAYSLIP: 'Payslip',
  REFERENCE: 'Reference',
  REFERENCE_REQUEST: 'Reference Request',
  OTHER: 'Other',
}

function typeBadge(type: string) {
  if (TENANCY_DOC_TYPES.includes(type)) return 'bg-[#4a6fa5]/10 text-[#4a6fa5]'
  return 'bg-[#8a7968]/10 text-[#8a7968]'
}

export default async function TenantDocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/login')

  const tenant = await prisma.tenant.findUnique({
    where: { userId: session.user.id },
    include: {
      tenancies: {
        include: {
          tenancy: {
            include: {
              documents: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
        where: { tenancy: { status: { in: ['ACTIVE', 'EXPIRING_SOON', 'HOLDING_OVER', 'EXPIRED'] } } },
        orderBy: { tenancy: { startDate: 'desc' } },
        take: 1,
      },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  const tenancyDocs = (tenant?.tenancies[0]?.tenancy?.documents ?? []).filter((d) =>
    TENANCY_DOC_TYPES.includes(d.type)
  )
  const myDocs = tenant?.documents ?? []

  function DocRow({ doc }: { doc: { id: string; name: string; type: string; url: string; createdAt: Date } }) {
    return (
      <div className="flex items-center gap-4 px-5 py-3 hover:bg-[#f5f2ee]/50 transition">
        <FileText size={18} className="text-[#8a7968] flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1a1a1a] truncate">{doc.name}</p>
          <p className="text-xs text-[#8a7968]">{format(new Date(doc.createdAt), 'd MMM yyyy')}</p>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded hidden sm:block ${typeBadge(doc.type)}`}>
          {TYPE_LABEL[doc.type] ?? doc.type}
        </span>
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3D2B] hover:text-[#122B1E] transition uppercase tracking-wide flex-shrink-0"
          download
        >
          <Download size={14} />
          Download
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <div>
        <h1
          className="text-3xl font-bold text-[#1a1a1a]"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Documents
        </h1>
        <p className="text-[#8a7968] text-sm mt-0.5">Your tenancy and personal documents</p>
      </div>

      {/* Tenancy Documents */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
            Tenancy Documents
          </h2>
          <p className="text-xs text-[#8a7968] mt-0.5">Your tenancy agreement, inventory, and related documents</p>
        </div>
        {tenancyDocs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[#8a7968] text-sm">No tenancy documents yet. Contact your agent if you need copies.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tenancyDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>

      {/* Personal Documents */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#1a1a1a]" style={{ fontFamily: 'Syne, sans-serif' }}>
              My Documents
            </h2>
            <p className="text-xs text-[#8a7968] mt-0.5">Your ID, proof of address, payslips, and references</p>
          </div>
          <TenantDocumentUpload />
        </div>
        {myDocs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[#8a7968] text-sm">No personal documents uploaded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myDocs.map((doc) => (
              <DocRow key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
