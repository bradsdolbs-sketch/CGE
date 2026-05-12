/**
 * Tenancy Agreement Import Script
 * Reads all TAs from Desktop/TA's, uploads to Supabase Storage,
 * creates Tenant + Tenancy + Document records in the database.
 *
 * Run: node scripts/import-tenancies.js
 */

require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TA_DIR = "/Users/bradley/Desktop/TA's"
const BUCKET = 'uploads'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(str) {
  // e.g. "11th April 2025" or "21 November 2025"
  if (!str) return null
  const clean = str.replace(/(\d+)(st|nd|rd|th)/, '$1')
  const d = new Date(clean)
  return isNaN(d.getTime()) ? null : d
}

async function uploadPDF(filePath, storageName) {
  const buffer = fs.readFileSync(filePath)
  const key = `tenancy-agreements/${storageName}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: 'application/pdf', upsert: true })
  if (error) throw new Error(`Upload failed for ${storageName}: ${error.message}`)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return data.publicUrl
}

async function findOrCreateTenantUser(firstName, lastName, emailHint) {
  // Generate a placeholder email from name
  const slug = `${firstName.toLowerCase().replace(/[^a-z]/g, '')}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@tenant.cge`
  const email = emailHint || slug

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`.trim(),
        email,
        password: bcrypt.hashSync('changeme!', 10),
        role: 'TENANT',
        active: true,
      }
    })
  }

  let tenant = await prisma.tenant.findUnique({ where: { userId: user.id } })
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        referencingStatus: 'PASSED',
      }
    })
  }
  return tenant
}

function parseTenantName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

// ─── Agreement data (extracted from PDFs) ────────────────────────────────────

const agreements = [
  {
    file: "TA_-_24_Jocelin_House_Leirum_Street_N1_0SDdocx.pdf",
    postcode: "N1 0SD",
    landlordName: "Bipin Uka",
    tenants: ["Danise Wen Zhe Fang", "Phuong Ly Thi Nguyen"],
    start: "11th April 2025",
    end: "10th April 2027",
    rentPcm: 2750,
    deposit: 3173,
    status: "ACTIVE",
  },
  {
    file: "TA_-_101_Pentonville_Road_N1_9LFdocx.pdf",
    postcode: "N1 9LF",
    landlordName: "Nick Stainthorpe",
    tenants: ["Shang Chen Shih", "Bhuwan Vashisht"],
    start: "7th July 2025",
    end: "6th July 2027",
    rentPcm: 3100,
    deposit: 3576,
    status: "ACTIVE",
  },
  {
    file: "TA_-_Flat_44_Eagle_Mansions_Salcombe_Road_London_N16_8AU_(1)docx.pdf",
    postcode: "N16 8AU",
    landlordName: "Nick Stainthorpe",
    tenants: ["Josh Hampson", "Katherine Maisie Moira Watson"],
    start: "13th September 2025",
    end: "12th September 2026",
    rentPcm: 1855,
    deposit: 2135,
    status: "ACTIVE",
  },
  {
    file: "TA_-_64_Enfield_Cloisters_Road_N1_6LDdocx.pdf",
    postcode: "N1 6LD",
    landlordName: "Nick Stainthorpe",
    tenants: ["Matthew Thomas Leslie Vine"],
    start: "31st December 2025",
    end: "30th December 2026",
    rentPcm: 1900,
    deposit: 2192,
    status: "ACTIVE",
  },
  {
    file: "TA_-_1_The_Pantiles_Bushey_Heath_Bushey_Hertfordshire_WD23_1LSdocx.pdf",
    postcode: "WD23 1LS",
    landlordName: "John Hellerman",
    tenants: ["Emilia Viczian", "Ronen Shuker"],
    start: "1st June 2025",
    end: "31st May 2026",
    rentPcm: 1360,
    deposit: 1269,
    status: "ACTIVE",
  },
  {
    file: "TA_-_22_Gade_Close_Rickmansworth_Road_Watford_Herts_WD18_7JHdocx.pdf",
    postcode: "WD18 7JH",
    landlordName: "John Hellerman",
    tenants: ["Joseph Dobra", "Maria Dobra"],
    start: "20th October 2025",
    end: "19th October 2026",
    rentPcm: 1385,
    deposit: 1425,
    status: "ACTIVE",
  },
  {
    // Original City Walk tenancy (now expired)
    file: "TA_-_18_City_Walk_Apartments_29_Seward_Street_London_EC1V_3RF_(1)docx.pdf",
    postcode: "EC1V 3RF",
    landlordName: "Dean Foden",
    tenants: ["Margherita Contri", "Saniah Ahmed"],
    start: "1st April 2024",
    end: "31st March 2026",
    rentPcm: 2640,
    deposit: 2423,
    status: "EXPIRED",
  },
  {
    // City Walk renewal (current)
    file: "TA_-_18_City_Walk_Apartments_29_Seward_Street_London_EC1V_3RF_(1)docx (1).pdf",
    postcode: "EC1V 3RF",
    landlordName: "Dean Foden",
    tenants: ["Margherita Contri", "Saniah Ahmed"],
    start: "1st April 2026",
    end: "31st July 2026",
    rentPcm: 2640,
    deposit: 2423,
    status: "ACTIVE",
  },
  {
    // 128 Richmond Road — current tenancy
    file: "TA_-_128_Richmond_Road_E8_3HWdocx.pdf",
    postcode: "E8 3HW",
    landlordName: "Tom Miller",
    tenants: ["Emma Russell", "Benjamin Araya Larrain"],
    start: "15th August 2025",
    end: "14th August 2027",
    rentPcm: 2300,
    deposit: 2653,
    status: "ACTIVE",
    newProperty: null, // matches existing 128 Richmond Road
  },
  {
    // 128a Richmond Road — previous tenancy (new property record needed)
    file: "TA_-_128a_Richmond_Road_London_E8_3HWdocx.pdf",
    postcode: "E8 3HW",
    landlordName: "Tom Miller",
    tenants: ["Jonathan Stachowiak", "Francesca Orrentino"],
    start: "1st March 2025",
    end: "29th August 2025",
    rentPcm: 2020,
    deposit: 2100,
    status: "EXPIRED",
    newProperty: {
      slug: "128a-richmond-road-e8",
      addressLine1: "128a Richmond Road",
      area: "Hackney",
      town: "London",
      postcode: "E8 3HW",
    },
  },
  {
    file: "TA_-_3_Treetop_Mews_NW6_7BLdocx.pdf",
    postcode: "NW6 7BL",
    landlordName: "Nikolaus Springer",
    tenants: ["Muhammad Gonda", "Yasmeen Ullah", "Samira Ullah"],
    start: "10th January 2025",
    end: "9th January 2027",
    rentPcm: 4000,
    deposit: 4615,
    status: "ACTIVE",
  },
  {
    file: "TA_-_59C_Crayford_Road_N7_0NEdocx.pdf",
    postcode: "N7 0NE",
    landlordName: "Rachel North",
    tenants: ["Taylor Evelyn Durkee", "Poppy Ella Massey"],
    start: "1st September 2025",
    end: "31st August 2026",
    rentPcm: 2000,
    deposit: 2308,
    status: "ACTIVE",
  },
  {
    file: "TA_-_22_Anthony_House_Pembury_Place_E5_8GZdocx.pdf",
    postcode: "E5 8GZ",
    landlordName: "Jack Kemp",
    tenants: ["Clare Goodwin"],
    start: "12th June 2025",
    end: "11th June 2026",
    rentPcm: 2000,
    deposit: 2308,
    status: "ACTIVE",
  },
  {
    file: "TA_-_7_Lincoln_Court__Bethune_Road_N16_5EBdocx.pdf",
    postcode: "N16 5EB",
    landlordName: "Laura Bussa",
    tenants: ["Harold Lee Y Kim", "Yixin Wang"],
    start: "21st December 2025",
    end: "20th December 2027",
    rentPcm: 3000,
    deposit: 3461,
    status: "ACTIVE",
  },
  {
    file: "TA_-_Flat_37_East_Gainsborough_Studios_Poole_Street_N1_5EDdocx.pdf",
    postcode: "N1 5ED",
    landlordName: "Daniele Borghi",
    tenants: ["Parul Ghiya", "Mayank Gupta"],
    start: "5th July 2025",
    end: "4th July 2026",
    rentPcm: 2450,
    deposit: 2769,
    status: "ACTIVE",
  },
  {
    // Nicola Pocock's N15 property — TA says N15 5AE (different from seed N15 3QR)
    file: "TA_-_Flat_3_152_West_Green_Road_London_N15_5AEdocx.pdf",
    postcode: "N15 5AE",
    landlordName: "Nicola Pocock",
    tenants: ["Lady Patricia Castaneda Buitrago"],
    start: "21st November 2025",
    end: "20th November 2026",
    rentPcm: 1600,
    deposit: 1846,
    status: "ACTIVE",
    // Update existing property postcode, or create new
    newProperty: {
      slug: "flat-3-152-west-green-road-n15",
      addressLine1: "Flat 3, 152 West Green Road",
      area: "Seven Sisters",
      town: "London",
      postcode: "N15 5AE",
    },
  },
  {
    file: "TA_-_Flat_42_Greencourt_House_200_Mile_End_Road_London_E1_4LD_(1)docx.pdf",
    postcode: "E1 4LD",
    landlordName: "Sandy Cook",
    tenants: ["Stay Easy Ltd"],
    start: "27th February 2026",
    end: "26th February 2028",
    rentPcm: 2150,
    deposit: 2423,
    status: "ACTIVE",
  },
  {
    file: "TA_-_Flat_8_Albany_Court_18_Plumbers_Row_LONDON_E1_1EP__(1)docx.pdf",
    postcode: "E1 1EP",
    landlordName: "Michael Lennox",
    tenants: ["Eoin McLaughlin", "Cathair O'Callaghan"],
    start: "9th June 2025",
    end: "15th June 2026",
    rentPcm: 2500,
    deposit: 2884,
    status: "ACTIVE",
  },
  {
    file: "Tenancy_Agreement_Chapter_Housedocx.pdf",
    postcode: "E2 6GS",
    landlordName: "Kerem Atasoy",
    tenants: ["Juan Camara Guerra", "Juliana Tuacek"],
    start: "13th April 2026",
    end: "12th September 2026",
    rentPcm: 3400,
    deposit: 3923,
    status: "ACTIVE",
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📄 Importing tenancy agreements...\n')

  // Load all properties and landlords
  const properties = await prisma.property.findMany({ include: { landlord: { include: { user: true } } } })
  const landlords = await prisma.landlord.findMany({ include: { user: true } })

  const propByPostcode = {}
  for (const p of properties) propByPostcode[p.postcode] = p

  const landlordByName = {}
  for (const l of landlords) {
    const full = `${l.firstName} ${l.lastName}`.trim().toLowerCase()
    landlordByName[full] = l
    // Also index by first name only for partial match
    landlordByName[l.firstName.toLowerCase()] = l
  }

  let success = 0, skipped = 0

  for (const ag of agreements) {
    console.log(`\n→ ${ag.file}`)

    try {
      // 1. Find property by postcode
      let property = propByPostcode[ag.postcode]

      // 2. If newProperty defined (address mismatch / new unit), create it
      if (!property && ag.newProperty) {
        // Find landlord
        const lKey = ag.landlordName.toLowerCase()
        const ll = landlordByName[lKey] || landlordByName[ag.landlordName.split(' ')[0].toLowerCase()]
        if (!ll) throw new Error(`Landlord not found: ${ag.landlordName}`)

        property = await prisma.property.create({
          data: {
            ...ag.newProperty,
            propertyType: 'FLAT',
            bedrooms: 1,
            bathrooms: 1,
            receptions: 1,
            status: ag.status === 'EXPIRED' ? 'AVAILABLE' : 'LET',
            listingType: 'RENT',
            publishedOnWeb: false,
            landlordId: ll.id,
          },
          include: { landlord: { include: { user: true } } }
        })
        propByPostcode[ag.postcode] = property // cache it (may conflict if two same postcode)
        console.log(`  ✓ Created new property: ${ag.newProperty.addressLine1}`)
      }

      if (!property) {
        // Try matching by landlord + partial postcode area
        const area = ag.postcode.split(' ')[0]
        const lKey = ag.landlordName.toLowerCase()
        const ll = landlordByName[lKey] || landlordByName[ag.landlordName.split(' ')[0].toLowerCase()]
        if (ll) {
          property = properties.find(p => p.postcode.startsWith(area) && p.landlordId === ll.id)
        }
      }

      if (!property) {
        console.log(`  ⚠ No property found for postcode ${ag.postcode} — skipping`)
        skipped++
        continue
      }

      const landlord = property.landlord

      // 3. Upload PDF to Supabase Storage
      const filePath = path.join(TA_DIR, ag.file)
      const storageName = ag.file.replace(/\s+/g, '_')
      const pdfUrl = await uploadPDF(filePath, storageName)
      console.log(`  ✓ Uploaded PDF`)

      // 4. Create tenant User + Tenant records
      const tenantRecords = []
      for (const name of ag.tenants) {
        const { firstName, lastName } = parseTenantName(name)
        const t = await findOrCreateTenantUser(firstName, lastName, null)
        tenantRecords.push(t)
      }
      console.log(`  ✓ Created/found ${tenantRecords.length} tenant(s)`)

      // 5. Create Tenancy
      const startDate = parseDate(ag.start)
      const endDate   = parseDate(ag.end)

      if (!startDate || !endDate) {
        console.log(`  ⚠ Could not parse dates (${ag.start} → ${ag.end}) — skipping tenancy`)
        skipped++
        continue
      }

      // Determine status
      const now = new Date()
      let tenancyStatus = ag.status
      if (tenancyStatus === 'ACTIVE' && endDate < now) tenancyStatus = 'EXPIRED'
      if (tenancyStatus === 'ACTIVE') {
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (endDate <= thirtyDays) tenancyStatus = 'EXPIRING_SOON'
      }

      const tenancy = await prisma.tenancy.create({
        data: {
          propertyId: property.id,
          landlordId: landlord.id,
          startDate,
          endDate,
          rentAmount: ag.rentPcm * 100,  // store in pence
          rentFrequency: 'monthly',
          depositAmount: ag.deposit * 100,
          depositScheme: 'TDS',
          status: tenancyStatus,
          tenants: {
            create: tenantRecords.map((t, i) => ({
              tenantId: t.id,
              isPrimary: i === 0,
            }))
          }
        }
      })

      // Update property status to LET if active tenancy
      if (tenancyStatus === 'ACTIVE' || tenancyStatus === 'EXPIRING_SOON') {
        await prisma.property.update({
          where: { id: property.id },
          data: { status: 'LET' }
        })
      }

      // 6. Create Document record linking PDF to tenancy
      await prisma.document.create({
        data: {
          name: `Tenancy Agreement — ${property.addressLine1}`,
          type: 'AST',
          url: pdfUrl,
          mimeType: 'application/pdf',
          tenancyId: tenancy.id,
        }
      })

      console.log(`  ✓ Tenancy created: ${property.addressLine1} | ${ag.start} → ${ag.end} | £${ag.rentPcm}/mo | Status: ${tenancyStatus}`)
      success++

    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`)
    }
  }

  // Final summary
  const [tenancies, docs, tenantCount] = await Promise.all([
    prisma.tenancy.count(),
    prisma.document.count(),
    prisma.tenant.count(),
  ])

  console.log(`\n${'='.repeat(55)}`)
  console.log(`✅ Import complete!`)
  console.log(`   Agreements processed: ${success} | Skipped: ${skipped}`)
  console.log(`   DB totals — Tenancies: ${tenancies} | Documents: ${docs} | Tenants: ${tenantCount}`)
}

main()
  .catch(e => { console.error('\n❌ Fatal:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
