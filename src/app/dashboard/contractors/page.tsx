import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import ContractorsClient from './ContractorsClient'

export const metadata = { title: 'Contractors' }

export default async function ContractorsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const contractors = await prisma.contractor.findMany({
    include: { _count: { select: { jobs: true } } },
    orderBy: { name: 'asc' },
  })

  return <ContractorsClient contractors={JSON.parse(JSON.stringify(contractors))} />
}
