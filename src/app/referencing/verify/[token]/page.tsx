import { jwtVerify } from 'jose'
import { notFound } from 'next/navigation'
import VerifyForm from './VerifyForm'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { role?: string }
}) {
  try {
    const { payload } = await jwtVerify(params.token, secret)
    const { type, applicationId } = payload as { type: string; applicationId: string }

    if (!['employer-verify', 'landlord-verify'].includes(type)) {
      return notFound()
    }

    const role = type === 'employer-verify' ? 'employer' : 'landlord'

    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="bg-[#1a1a1a] px-6 py-5 mb-0 rounded-t-xl">
            <p className="text-white font-bold text-lg">Central Gate Estates</p>
            <span className="block w-8 h-0.5 bg-[#1A3D2B] mt-2" />
          </div>

          <VerifyForm token={params.token} role={role} applicationId={applicationId as string} />
        </div>
      </div>
    )
  } catch {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-2xl font-bold text-[#1a1a1a] mb-2">Link Expired</p>
          <p className="text-gray-500">This verification link has expired or is invalid. Please contact Central Gate Estates at <a href="mailto:hello@centralgateestates.com" className="text-[#1A3D2B] hover:underline">hello@centralgateestates.com</a>.</p>
        </div>
      </div>
    )
  }
}
