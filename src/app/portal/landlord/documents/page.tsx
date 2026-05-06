import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { FileText, Download, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import ComplianceCertUpload from '@/components/portal/ComplianceCertUpload'

export const metadata = { title: 'Documents' }

function complianceStatus(expiryDate: Date | null) {
  if (!expiryDate) return 'missing'
  const days = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000)
  if (days < 0) return 'expired'
  if (days <= 30) return 'expiring'
  return 'valid'
}

const COMPLIANCE_LABELS: Record<string, string> = {
  GAS_SAFETY: 'Gas Safety Certificate',
  EICR: 'EICR (Electrical)',
  EPC: 'Energy Performance Certificate',
  HMO_LICENCE: 'HMO Licence',
  LEGIONELLA: 'Legionella Risk Assessment',
  PAT_TESTING: 'PAT Testing',
  FIRE_SAFETY: 'Fire Safety',
  RIGHT_TO_RENT: 'Right to Rent',
}

export default async function LandlordDocumentsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const landlord = await prisma.landlord.findFirst({
    where: { user: { email: session.user?.email! } },
    include: {
      properties: {
        include: {
          complianceItems: true,
          tenancies: {
            where: { status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
            include: { documents: true },
          },
        },
      },
    },
  })

  if (!landlord) redirect('/login')

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-display font-600 uppercase tracking-editorial text-terracotta mb-1">Documents</p>
        <h1 className="font-display font-800 text-3xl text-charcoal">Property Documents</h1>
        <p className="text-sm text-taupe mt-1">Compliance certificates and tenancy documents across your portfolio.</p>
      </div>

      {landlord.properties.length === 0 && (
        <div className="text-center py-16 text-taupe">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-display font-600">No documents yet</p>
        </div>
      )}

      {landlord.properties.map((property) => {
        const activeTenancy = property.tenancies[0]
        return (
          <div key={property.id} className="border border-cream-200 bg-white">
            <div className="px-6 py-4 bg-cream-50 border-b border-cream-200">
              <h2 className="font-display font-700 text-lg text-charcoal">{property.addressLine1}</h2>
              <p className="text-xs text-taupe">{property.area} · {property.postcode}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Compliance */}
              <div>
                <h3 className="text-xs font-display font-600 uppercase tracking-editorial text-taupe mb-3">Compliance Certificates</h3>
                {property.complianceItems.length === 0 ? (
                  <p className="text-sm text-taupe italic">No compliance items recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {property.complianceItems.map((item) => {
                      const status = complianceStatus(item.expiryDate)
                      const Icon = status === 'valid' ? ShieldCheck : status === 'expiring' ? ShieldAlert : ShieldX
                      const colour = status === 'valid' ? 'text-green-600' : status === 'expiring' ? 'text-amber-600' : 'text-red-600'
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${colour}`} />
                            <div>
                              <p className="text-sm font-sans font-500 text-charcoal">{COMPLIANCE_LABELS[item.type] || item.type}</p>
                              {item.expiryDate && (
                                <p className={`text-xs ${colour}`}>
                                  {status === 'expired' ? 'Expired' : 'Expires'} {new Date(item.expiryDate).toLocaleDateString('en-GB')}
                                </p>
                              )}
                            </div>
                          </div>
                          {item.certificateUrl ? (
                            <a href={item.certificateUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-terracotta hover:underline">
                              <Download className="w-3 h-3" /> Download
                            </a>
                          ) : (
                            <ComplianceCertUpload itemId={item.id} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Tenancy documents */}
              {activeTenancy && activeTenancy.documents.length > 0 && (
                <div>
                  <h3 className="text-xs font-display font-600 uppercase tracking-editorial text-taupe mb-3">Tenancy Documents</h3>
                  <div className="space-y-2">
                    {activeTenancy.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-taupe" />
                          <div>
                            <p className="text-sm font-sans font-500 text-charcoal">{doc.name}</p>
                            <p className="text-xs text-taupe">{doc.type.replace(/_/g, ' ')} · {new Date(doc.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-terracotta hover:underline">
                          <Download className="w-3 h-3" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
