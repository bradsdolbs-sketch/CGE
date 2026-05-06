import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

const propTypeMap: Record<string, string> = {
  FLAT: 'Flat',
  HOUSE: 'Detached House',
  STUDIO: 'Studio',
  MAISONETTE: 'Maisonette',
  HMO: 'House Share',
  COMMERCIAL: 'Commercial Property',
  LAND: 'Land',
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const properties = await prisma.property.findMany({
    where: {
      publishedOnWeb: true,
      listing: { publishRightmove: true },
      status: { in: ['AVAILABLE', 'LET_AGREED'] },
    },
    include: { listing: true },
  })

  const agentRef = process.env.RIGHTMOVE_BRANCH_ID ?? 'CGE001'
  const branchRef = process.env.RIGHTMOVE_AGENT_ID ?? 'CGEAGENT'

  let propertiesXml = ''
  for (const prop of properties) {
    const l = prop.listing!
    const photos = l.photos.map((url, i) =>
      `<MEDIA><MEDIA_TYPE>image</MEDIA_TYPE><ORDERING>${i + 1}</ORDERING><URL>${escapeXml(url)}</URL></MEDIA>`
    ).join('')

    propertiesXml += `
    <PROPERTY>
      <AGENT_REF>${escapeXml(prop.id)}</AGENT_REF>
      <ADDRESS_1>${escapeXml(prop.addressLine1)}</ADDRESS_1>
      ${prop.addressLine2 ? `<ADDRESS_2>${escapeXml(prop.addressLine2)}</ADDRESS_2>` : ''}
      <TOWN>${escapeXml(prop.town)}</TOWN>
      <POSTCODE1>${escapeXml(prop.postcode.split(' ')[0] ?? prop.postcode)}</POSTCODE1>
      <POSTCODE2>${escapeXml(prop.postcode.split(' ')[1] ?? '')}</POSTCODE2>
      <DISPLAY_ADDRESS>${escapeXml(`${prop.addressLine1}, ${prop.area}, ${prop.postcode}`)}</DISPLAY_ADDRESS>
      <PROP_TYPE>${escapeXml(propTypeMap[prop.propertyType] ?? prop.propertyType)}</PROP_TYPE>
      <BEDROOMS>${prop.bedrooms}</BEDROOMS>
      <BATHROOMS>${prop.bathrooms}</BATHROOMS>
      <PRICE>${l.price}</PRICE>
      <PRICE_QUALIFIER>Per Month</PRICE_QUALIFIER>
      <RENT_FREQUENCY>Monthly</RENT_FREQUENCY>
      <LET_TYPE>Long Term</LET_TYPE>
      <FURNISHED_TYPE>${l.furnished ? 'Furnished' : 'Unfurnished'}</FURNISHED_TYPE>
      <AVAILABILITY>${prop.status === 'LET_AGREED' ? 'Let Agreed' : 'Available'}</AVAILABILITY>
      ${l.availableFrom ? `<AVAILABLE_FROM>${formatDate(new Date(l.availableFrom))}</AVAILABLE_FROM>` : ''}
      <DESCRIPTION>${escapeXml(l.description)}</DESCRIPTION>
      <FEATURE1>${escapeXml(l.features[0] ?? '')}</FEATURE1>
      <FEATURE2>${escapeXml(l.features[1] ?? '')}</FEATURE2>
      <FEATURE3>${escapeXml(l.features[2] ?? '')}</FEATURE3>
      <FEATURE4>${escapeXml(l.features[3] ?? '')}</FEATURE4>
      ${prop.epcRating ? `<EPC_RATING>${escapeXml(prop.epcRating ?? '')}</EPC_RATING>` : ''}
      <MEDIA_COUNT>${l.photos.length}</MEDIA_COUNT>
      ${photos}
      ${l.floorplan ? `<FLOORPLAN><URL>${escapeXml(l.floorplan)}</URL></FLOORPLAN>` : ''}
      <PARKING>${l.parking ? 'Yes' : 'No'}</PARKING>
      <GARDEN>${l.garden ? 'Yes' : 'No'}</GARDEN>
      <BALCONY>${l.balcony ? 'Yes' : 'No'}</BALCONY>
      <PETS_ALLOWED>${l.petsAllowed ? 'Yes' : 'No'}</PETS_ALLOWED>
    </PROPERTY>`
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<BLM version="3.5" publication="live">
  <HEADER>
    <AGENT_REF>${escapeXml(agentRef)}</AGENT_REF>
    <VERSION>3.5</VERSION>
    <SENDER>
      <NAME>Central Gate Estates</NAME>
      <EMAIL>hello@centralgateestates.com</EMAIL>
      <TELEPHONE>WhatsApp us</TELEPHONE>
    </SENDER>
    <SOFTWARE_VERSION>Central Gate Estates v1.0</SOFTWARE_VERSION>
    <DATE>${formatDate(new Date())}</DATE>
    <TIME>${new Date().toTimeString().slice(0, 5)}</TIME>
    <PROPERTY_COUNT>${properties.length}</PROPERTY_COUNT>
  </HEADER>
  <BODY>
    <BRANCHES>
      <BRANCH>
        <BRANCH_REF>${escapeXml(branchRef)}</BRANCH_REF>
        <PROPERTIES>${propertiesXml}
        </PROPERTIES>
      </BRANCH>
    </BRANCHES>
  </BODY>
</BLM>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
