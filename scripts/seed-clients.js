// Run with: node scripts/seed-clients.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()
const hash = (pw) => bcrypt.hashSync(pw, 10)

async function main() {
  console.log('🌱 Seeding CGE client data...')

  // ── Clear existing data ──────────────────────────────────────────────────
  console.log('  → Clearing existing data...')
  await prisma.note.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.emailLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.rightToRentCheck.deleteMany()
  await prisma.viewing.deleteMany()
  await prisma.enquiry.deleteMany()
  await prisma.complianceItem.deleteMany()
  await prisma.inspection.deleteMany()
  await prisma.maintenanceUpdate.deleteMany()
  await prisma.maintenanceRequest.deleteMany()
  await prisma.contractor.deleteMany()
  await prisma.fee.deleteMany()
  await prisma.landlordStatementLine.deleteMany()
  await prisma.landlordStatement.deleteMany()
  await prisma.rentPayment.deleteMany()
  await prisma.guarantor.deleteMany()
  await prisma.tenancyTenant.deleteMany()
  await prisma.tenancy.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.property.deleteMany()
  await prisma.landlord.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  console.log('  ✓ Cleared')

  // ── Admin users ──────────────────────────────────────────────────────────
  console.log('  → Creating admin users...')
  await prisma.user.create({ data: { name: 'Claire Bruce', email: 'claire@centralgatestates.co.uk', password: hash('password123'), role: 'ADMIN', phone: '+447700900001', whatsapp: '+447700900001', jobTitle: 'Director & Property Manager', active: true } })
  await prisma.user.create({ data: { name: 'Bradley', email: 'bradley@centralgatestates.co.uk', password: hash('password123'), role: 'ADMIN', phone: '+447700900002', whatsapp: '+447700900002', jobTitle: 'Director & Lettings Negotiator', active: true } })
  console.log('  ✓ Admin users created')

  // ── Landlord users ───────────────────────────────────────────────────────
  console.log('  → Creating landlord users...')
  const landlordDefs = [
    { name: 'Bipin Uka',         email: 'bipinuka@hotmail.com',          phone: '07725897240'  },
    { name: 'Nick Stainthorpe',  email: 'nstainthorpe@reedsmith.com',    phone: '07813082463'  },
    { name: 'John Hellerman',    email: 'hellermanjohn@gmail.com',        phone: '07887562672'  },
    { name: 'Nicola Pocock',     email: 'nicolapocock@gmail.com',         phone: '07587950721'  },
    { name: 'Dean Foden',        email: 'dean.foden@yahoo.co.uk',         phone: '07526402846'  },
    { name: 'Tom Miller',        email: 'tommee67@yahoo.co.uk',           phone: '32494944486'  },
    { name: 'Phil Orme',         email: 'philorme@hotmail.com',           phone: '6591775992'   },
    { name: 'Laura Bussa',       email: 'lgbussa@gmail.com',              phone: '18573529784'  },
    { name: 'Giulia Cerundolo',  email: 'giulia.ce87@gmail.com',          phone: null           },
    { name: 'Rachel North',      email: 'rachaelnorth@ymail.com',         phone: null           },
    { name: 'Jack Kemp',         email: 'jackjbkemp@gmail.com',           phone: '07464295639'  },
    { name: 'Sharon Savory',     email: 'sps.jhs.properties@gmail.com',  phone: '07801552560'  },
    { name: 'Sandy Cook',        email: 'sandysciutto@gmail.com',         phone: '07957340457'  },
    { name: 'Daniele Borghi',    email: 'daniborghi@outlook.com',         phone: null           },
    { name: 'Kerem Atasoy',      email: 'kkatasoy@gmail.com',             phone: null           },
    { name: 'Neil Andrew',       email: 'mr.neil.andrew@gmail.com',       phone: '07977538180'  },
    { name: 'Ruby Huang',        email: 'ruby.h.huang@outlook.com',       phone: '07441394567'  },
    { name: 'Olivier Douala',    email: 'olivier.douala@gmail.com',       phone: '07537930030'  },
    { name: 'Nikolaus Springer', email: 'nspringer@mac.com',              phone: '4915201044090'},
    { name: 'Michael Lennox',    email: 'carolinejlennox@gmail.com',      phone: '07816845872'  },
    { name: 'Olamipo Macaulay',  email: 'lamisylish@gmail.com',           phone: '07932506484'  },
    { name: 'Saj',               email: 'junkmora@gmail.com',             phone: '07956449877'  },
  ]

  const userMap = {}
  for (const def of landlordDefs) {
    const u = await prisma.user.create({
      data: { name: def.name, email: def.email, password: hash('changeme!'), role: 'LANDLORD', phone: def.phone ?? undefined, active: true }
    })
    userMap[def.name] = u.id
    process.stdout.write('.')
  }
  console.log('\n  ✓ Landlord users created')

  // ── Landlord records ─────────────────────────────────────────────────────
  console.log('  → Creating landlord records...')
  const landlordRecordDefs = [
    { name: 'Bipin Uka',         firstName: 'Bipin',    lastName: 'Uka',         phone: '07725897240',   preferred: 'email',    uk: true  },
    { name: 'Nick Stainthorpe',  firstName: 'Nick',     lastName: 'Stainthorpe', phone: '07813082463',   preferred: 'email',    uk: true  },
    { name: 'John Hellerman',    firstName: 'John',     lastName: 'Hellerman',   phone: '07887562672',   preferred: 'email',    uk: true  },
    { name: 'Nicola Pocock',     firstName: 'Nicola',   lastName: 'Pocock',      phone: '07587950721',   preferred: 'email',    uk: true  },
    { name: 'Dean Foden',        firstName: 'Dean',     lastName: 'Foden',       phone: '07526402846',   preferred: 'email',    uk: true  },
    { name: 'Tom Miller',        firstName: 'Tom',      lastName: 'Miller',      phone: '32494944486',   preferred: 'email',    uk: false },
    { name: 'Phil Orme',         firstName: 'Phil',     lastName: 'Orme',        phone: '6591775992',    preferred: 'email',    uk: false },
    { name: 'Laura Bussa',       firstName: 'Laura',    lastName: 'Bussa',       phone: '18573529784',   preferred: 'email',    uk: false },
    { name: 'Giulia Cerundolo',  firstName: 'Giulia',   lastName: 'Cerundolo',   phone: null,            preferred: 'email',    uk: false },
    { name: 'Rachel North',      firstName: 'Rachel',   lastName: 'North',       phone: null,            preferred: 'email',    uk: true  },
    { name: 'Jack Kemp',         firstName: 'Jack',     lastName: 'Kemp',        phone: '07464295639',   preferred: 'phone',    uk: true  },
    { name: 'Sharon Savory',     firstName: 'Sharon',   lastName: 'Savory',      phone: '07801552560',   preferred: 'email',    uk: true  },
    { name: 'Sandy Cook',        firstName: 'Sandy',    lastName: 'Cook',        phone: '07957340457',   preferred: 'phone',    uk: true  },
    { name: 'Daniele Borghi',    firstName: 'Daniele',  lastName: 'Borghi',      phone: null,            preferred: 'email',    uk: false },
    { name: 'Kerem Atasoy',      firstName: 'Kerem',    lastName: 'Atasoy',      phone: null,            preferred: 'email',    uk: false },
    { name: 'Neil Andrew',       firstName: 'Neil',     lastName: 'Andrew',      phone: '07977538180',   preferred: 'whatsapp', uk: true  },
    { name: 'Ruby Huang',        firstName: 'Ruby',     lastName: 'Huang',       phone: '07441394567',   preferred: 'email',    uk: true  },
    { name: 'Olivier Douala',    firstName: 'Olivier',  lastName: 'Douala',      phone: '07537930030',   preferred: 'whatsapp', uk: true  },
    { name: 'Nikolaus Springer', firstName: 'Nikolaus', lastName: 'Springer',    phone: '4915201044090', preferred: 'email',    uk: false },
    { name: 'Michael Lennox',    firstName: 'Michael',  lastName: 'Lennox',      phone: '07816845872',   preferred: 'phone',    uk: true  },
    { name: 'Olamipo Macaulay',  firstName: 'Olamipo',  lastName: 'Macaulay',    phone: '07932506484',   preferred: 'whatsapp', uk: true  },
    { name: 'Saj',               firstName: 'Saj',      lastName: '',            phone: '07956449877',   preferred: 'whatsapp', uk: true  },
  ]

  const landlordMap = {}
  for (const def of landlordRecordDefs) {
    const l = await prisma.landlord.create({
      data: {
        userId: userMap[def.name],
        firstName: def.firstName,
        lastName: def.lastName,
        phone: def.phone ?? undefined,
        preferredContact: def.preferred,
        serviceLevel: 'FULL_MANAGEMENT',
        ukResident: def.uk,
        statementEmail: true,
        statementFrequency: 'monthly',
      }
    })
    landlordMap[def.name] = l.id
    process.stdout.write('.')
  }
  console.log('\n  ✓ Landlord records created')

  // ── Properties ───────────────────────────────────────────────────────────
  console.log('  → Creating properties...')
  const properties = [
    // Bipin Uka
    { slug: '24-jocelyn-house-n1',             landlord: 'Bipin Uka',         addr: '24 Jocelyn House',                           area: 'Islington',       town: 'London',  pc: 'N1 0SD',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Nick Stainthorpe
    { slug: '44-eagle-mansions-n16',           landlord: 'Nick Stainthorpe',  addr: '44 Eagle Mansions',                           area: 'Stoke Newington', town: 'London',  pc: 'N16 8AU',  type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    { slug: '64-enfield-cloisters-road-n1',    landlord: 'Nick Stainthorpe',  addr: '64 Enfield Cloisters Road',                   area: 'Hoxton',          town: 'London',  pc: 'N1 6LD',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    { slug: '101-pentonville-road-n1',         landlord: 'Nick Stainthorpe',  addr: '101 Pentonville Road',                        area: 'Islington',       town: 'London',  pc: 'N1 9LF',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // John Hellerman
    { slug: '1-pantiles-bushey-wd23',          landlord: 'John Hellerman',    addr: '1 Pantiles, Bushey Heath',                    area: 'Bushey',          town: 'Watford', pc: 'WD23 1LS', type: 'HOUSE', beds: 3, baths: 1, recs: 2, status: 'LET'       },
    { slug: '22-gade-close-wd18',              landlord: 'John Hellerman',    addr: '22 Gade Close',                               area: 'Watford',         town: 'Watford', pc: 'WD18 7JH', type: 'HOUSE', beds: 2, baths: 1, recs: 1, status: 'LET'       },
    { slug: '10-paterson-court-ec1v',          landlord: 'John Hellerman',    addr: '10 Paterson Court',                           area: 'Clerkenwell',     town: 'London',  pc: 'EC1V 9EX', type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Nicola Pocock
    { slug: '23-jeddo-road-w12',               landlord: 'Nicola Pocock',     addr: '23 Jeddo Road',                               area: 'Shepherd\'s Bush', town: 'London', pc: 'W12 9EB',  type: 'FLAT',  beds: 2, baths: 1, recs: 1, status: 'LET'       },
    { slug: '123-west-green-road-n15',         landlord: 'Nicola Pocock',     addr: '123 West Green Road',                         area: 'Seven Sisters',   town: 'London',  pc: 'N15 3QR',  type: 'FLAT',  beds: 2, baths: 1, recs: 1, status: 'LET'       },
    // Dean Foden
    { slug: 'flat-18-city-walk-ec1v',          landlord: 'Dean Foden',        addr: 'Flat 18, City Walk Apartments, 29 Seward St', area: 'Clerkenwell',     town: 'London',  pc: 'EC1V 3RF', type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Tom Miller
    { slug: '128-richmond-road-e8',            landlord: 'Tom Miller',        addr: '128 Richmond Road',                           area: 'Hackney',         town: 'London',  pc: 'E8 3HW',   type: 'FLAT',  beds: 2, baths: 1, recs: 1, status: 'LET'       },
    // Phil Orme
    { slug: '84-eyot-house-se16',              landlord: 'Phil Orme',         addr: '84 Eyot House',                               area: 'Bermondsey',      town: 'London',  pc: 'SE16 4BP', type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Laura Bussa
    { slug: '7-lincoln-court-n16',             landlord: 'Laura Bussa',       addr: '7 Lincoln Court, Bethune Road',               area: 'Stoke Newington', town: 'London',  pc: 'N16 5EB',  type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Giulia Cerundolo
    { slug: '19-wood-close-e2',                landlord: 'Giulia Cerundolo',  addr: '19 Wood Close',                               area: 'Bethnal Green',   town: 'London',  pc: 'E2 6ET',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Rachel North
    { slug: '59c-crayford-road-n7',            landlord: 'Rachel North',      addr: '59C Crayford Road',                           area: 'Holloway',        town: 'London',  pc: 'N7 0NE',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Jack Kemp
    { slug: '22-anthony-house-e5',             landlord: 'Jack Kemp',         addr: '22 Anthony House',                            area: 'Clapton',         town: 'London',  pc: 'E5 8GZ',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Sharon Savory
    { slug: 'flat-12-50-holly-street-e8',      landlord: 'Sharon Savory',     addr: 'Flat 12, 50 Holly Street',                    area: 'Hackney',         town: 'London',  pc: 'E8 3HS',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Sandy Cook
    { slug: '42-green-court-e1',               landlord: 'Sandy Cook',        addr: '42 Green Court, 200 Bethnal Green Road',       area: 'Bethnal Green',   town: 'London',  pc: 'E1 4LD',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Daniele Borghi
    { slug: 'flat-37-east-gainsborough-n1',    landlord: 'Daniele Borghi',    addr: 'Flat 37, East Gainsborough Studios, Poole St', area: 'Hoxton',          town: 'London',  pc: 'N1 5ED',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Kerem Atasoy
    { slug: '15-chapter-house-e2',             landlord: 'Kerem Atasoy',      addr: '15 Chapter House',                            area: 'Bethnal Green',   town: 'London',  pc: 'E2 6GS',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Neil Andrew
    { slug: '28-winns-terrace-e17',            landlord: 'Neil Andrew',       addr: '28 Winns Terrace',                            area: 'Walthamstow',     town: 'London',  pc: 'E17 5EJ',  type: 'FLAT',  beds: 2, baths: 1, recs: 1, status: 'LET'       },
    { slug: '8-kingsfield-house-n16',          landlord: 'Neil Andrew',       addr: '8 Kingsfield House, Victorian Grove',          area: 'Stoke Newington', town: 'London',  pc: 'N16 8EY',  type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Ruby Huang
    { slug: '7-pelling-e14',                   landlord: 'Ruby Huang',        addr: '7 Pelling',                                   area: 'Poplar',          town: 'London',  pc: 'E14 7EN',  type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Olivier Douala
    { slug: 'flat-11-baron-street-n1',         landlord: 'Olivier Douala',    addr: 'Flat 11, 13-17 Baron Street',                 area: 'Islington',       town: 'London',  pc: 'N1 9HP',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'AVAILABLE' },
    // Nikolaus Springer
    { slug: '3-treetop-mews-nw6',              landlord: 'Nikolaus Springer', addr: '3 Treetop Mews',                              area: 'West Hampstead',  town: 'London',  pc: 'NW6 7BL',  type: 'FLAT',  beds: 2, baths: 1, recs: 1, status: 'LET'       },
    // Michael Lennox
    { slug: '8-albany-court-e1',               landlord: 'Michael Lennox',    addr: '8 Albany Court, Plumbers Row',                area: 'Whitechapel',     town: 'London',  pc: 'E1 1EP',   type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'LET'       },
    // Olamipo Macaulay
    { slug: '113-dorset-road-e7',              landlord: 'Olamipo Macaulay',  addr: '113 Dorset Road',                             area: 'Forest Gate',     town: 'London',  pc: 'E7 8PX',   type: 'FLAT',  beds: 2, baths: 1, recs: 1, status: 'LET'       },
    // Saj
    { slug: '122b-boundary-road-nw8',          landlord: 'Saj',               addr: '122B Boundary Road',                          area: 'St John\'s Wood', town: 'London',  pc: 'NW8 0RH',  type: 'FLAT',  beds: 1, baths: 1, recs: 1, status: 'AVAILABLE' },
  ]

  for (const p of properties) {
    await prisma.property.create({
      data: {
        slug: p.slug,
        addressLine1: p.addr,
        area: p.area,
        town: p.town,
        postcode: p.pc,
        propertyType: p.type,
        bedrooms: p.beds,
        bathrooms: p.baths,
        receptions: p.recs,
        status: p.status,
        listingType: 'RENT',
        publishedOnWeb: false,
        landlordId: landlordMap[p.landlord],
      }
    })
    process.stdout.write('.')
  }
  console.log(`\n  ✓ ${properties.length} properties created`)

  // ── Verify ───────────────────────────────────────────────────────────────
  const [users, landlords, props] = await Promise.all([
    prisma.user.count(),
    prisma.landlord.count(),
    prisma.property.count(),
  ])
  console.log(`\n✅ Seeding complete!`)
  console.log(`   Users: ${users} | Landlords: ${landlords} | Properties: ${props}`)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
