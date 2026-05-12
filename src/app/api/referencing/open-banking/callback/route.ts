import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { detectIncome } from '@/lib/income-detection'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  if (errorParam || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/portal/tenant/referencing?ob_error=cancelled`)
  }

  const clientId = process.env.TRUELAYER_CLIENT_ID
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/portal/tenant/referencing?ob_error=not_configured`)
  }

  // Verify state JWT to get applicationId
  let applicationId: string
  try {
    const secret = new TextEncoder().encode(clientSecret)
    const { payload } = await jwtVerify(state, secret)
    applicationId = payload.applicationId as string
  } catch {
    return NextResponse.redirect(`${baseUrl}/portal/tenant/referencing?ob_error=invalid_state`)
  }

  const isSandbox = process.env.TRUELAYER_SANDBOX === 'true'
  const apiHost = isSandbox ? 'api.truelayer-sandbox.com' : 'api.truelayer.com'
  const redirectUri = `${baseUrl}/api/referencing/open-banking/callback`

  try {
    // Exchange code for access token
    const tokenRes = await fetch(`https://auth.${isSandbox ? 'truelayer-sandbox' : 'truelayer'}.com/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })
    if (!tokenRes.ok) throw new Error('Token exchange failed')
    const { access_token } = await tokenRes.json() as { access_token: string }

    // Fetch accounts
    const accountsRes = await fetch(`https://${apiHost}/data/v1/accounts`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!accountsRes.ok) throw new Error('Failed to fetch accounts')
    const { results: accounts } = await accountsRes.json() as { results: { account_id: string }[] }
    if (accounts.length === 0) throw new Error('No accounts found')

    // Fetch 90 days of transactions from the first account
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const txRes = await fetch(
      `https://${apiHost}/data/v1/accounts/${accounts[0].account_id}/transactions?from=${since}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    if (!txRes.ok) throw new Error('Failed to fetch transactions')
    const { results: transactions } = await txRes.json() as {
      results: { amount: number; timestamp: string; description: string; currency: string }[]
    }

    const income = detectIncome(transactions)

    const app = await prisma.tenantReferenceApplication.findUnique({
      where: { id: applicationId },
      select: { annualSalary: true },
    })

    const detectedAnnual = income.monthlyAmount * 12
    const declaredAnnual = app?.annualSalary ?? 0
    const salaryMatch = declaredAnnual > 0
      ? Math.abs(detectedAnnual - declaredAnnual) / declaredAnnual <= 0.1
      : false

    await prisma.tenantReferenceApplication.update({
      where: { id: applicationId },
      data: {
        openBankingStatus: income.detected ? 'VERIFIED' : 'CONNECTED',
        openBankingConnectedAt: new Date(),
        openBankingVerifiedAt: income.detected ? new Date() : null,
        openBankingVerifiedSalary: income.detected ? income.monthlyAmount * 12 : null,
        openBankingRawData: JSON.stringify({ income, transactionCount: transactions.length }),
        // If detected salary matches declared within ±10%, auto-confirm employer
        ...(income.detected && salaryMatch ? {
          employerConfirmed: true,
          employerConfirmedAt: new Date(),
          employerConfirmedSalary: income.monthlyAmount * 12,
          employerNotes: `Auto-confirmed via open banking (${income.confidence} confidence, ${income.months} months of data)`,
        } : {}),
      },
    })

    return NextResponse.redirect(`${baseUrl}/portal/tenant/referencing?ob_complete=1`)
  } catch (err) {
    console.error('Open banking callback error:', err)
    await prisma.tenantReferenceApplication.update({
      where: { id: applicationId },
      data: { openBankingStatus: 'FAILED' },
    })
    return NextResponse.redirect(`${baseUrl}/portal/tenant/referencing?ob_error=failed`)
  }
}
