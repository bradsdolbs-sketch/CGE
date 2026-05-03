import {
  PrismaClient, UserRole, PropertyType, PropertyStatus, ListingType,
  TenancyStatus, PaymentStatus, MaintenanceCategory, MaintenancePriority,
  MaintenanceStatus, ComplianceType, InspectionType, InspectionStatus,
  EnquirySource, ApplicantStage, ReferencingStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ── Clean ─────────────────────────────────────────────────────────────────
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
  console.log('  ✓ Cleared existing data')

  const hash = (pw: string) => bcrypt.hashSync(pw, 10)
  const now = new Date()

  // ── Admin users ───────────────────────────────────────────────────────────
  console.log('  → Seeding admin users...')
  const [claire, bradley] = await Promise.all([
    prisma.user.create({ data: { name: 'Claire Bruce', email: 'claire@centralgatestates.co.uk', password: hash('password123'), role: UserRole.ADMIN, phone: '+447700900001', whatsapp: '+447700900001', jobTitle: 'Director & Property Manager', active: true } }),
    prisma.user.create({ data: { name: 'Bradley', email: 'bradley@centralgatestates.co.uk', password: hash('password123'), role: UserRole.ADMIN, phone: '+447700900002', whatsapp: '+447700900002', jobTitle: 'Director & Lettings Negotiator', active: true } }),
  ])

  // ── Demo tenant users (for dashboard testing) ─────────────────────────────
  const [tom_user, priya_user] = await Promise.all([
    prisma.user.create({ data: { name: 'Tom Whitfield', email: 'tom@example.com', password: hash('password123'), role: UserRole.TENANT, phone: '+447700900005', active: true } }),
    prisma.user.create({ data: { name: 'Priya Patel', email: 'priya@example.com', password: hash('password123'), role: UserRole.TENANT, phone: '+447700900006', active: true } }),
  ])

  // ── Landlord user accounts (real clients) ─────────────────────────────────
  console.log('  → Seeding landlord users...')
  const [
    bipin_u, nick_u, john_u, nicola_u, dean_u, tom_miller_u, phil_u,
    laura_u, giulia_u, rachel_u, jack_u, sharon_u, sandy_u, daniele_u,
    kerem_u, neil_u, ruby_u, olivier_u, nikolaus_u, michael_u, olamipo_u, saj_u,
  ] = await Promise.all([
    prisma.user.create({ data: { name: 'Bipin Uka',        email: 'bipinuka@hotmail.com',           password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07725897240',  active: true } }),
    prisma.user.create({ data: { name: 'Nick Stainthorpe', email: 'nstainthorpe@reedsmith.com',     password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07813082463',  active: true } }),
    prisma.user.create({ data: { name: 'John Hellerman',   email: 'hellermanjohn@gmail.com',        password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07887562672',  active: true } }),
    prisma.user.create({ data: { name: 'Nicola Pocock',    email: 'Nicolapocock@gmail.com',         password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07587950721',  active: true } }),
    prisma.user.create({ data: { name: 'Dean Foden',       email: 'dean.foden@yahoo.co.uk',         password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07526402846',  active: true } }),
    prisma.user.create({ data: { name: 'Tom Miller',       email: 'tommee67@yahoo.co.uk',           password: hash('changeme!'), role: UserRole.LANDLORD, phone: '32494944486',  active: true } }),
    prisma.user.create({ data: { name: 'Phil Orme',        email: 'philorme@hotmail.com',           password: hash('changeme!'), role: UserRole.LANDLORD, phone: '6591775992',   active: true } }),
    prisma.user.create({ data: { name: 'Laura Bussa',      email: 'lgbussa@gmail.com',              password: hash('changeme!'), role: UserRole.LANDLORD, phone: '18573529784',  active: true } }),
    prisma.user.create({ data: { name: 'Giulia Cerundolo', email: 'giulia.ce87@gmail.com',          password: hash('changeme!'), role: UserRole.LANDLORD, active: true } }),
    prisma.user.create({ data: { name: 'Rachel North',     email: 'rachaelnorth@ymail.com',         password: hash('changeme!'), role: UserRole.LANDLORD, active: true } }),
    prisma.user.create({ data: { name: 'Jack Kemp',        email: 'jackjbkemp@gmail.com',           password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07464295639',  active: true } }),
    prisma.user.create({ data: { name: 'Sharon Savory',    email: 'sps.jhs.properties@gmail.com',  password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07801552560',  active: true } }),
    prisma.user.create({ data: { name: 'Sandy Cook',       email: 'sandysciutto@gmail.com',         password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07957340457',  active: true } }),
    prisma.user.create({ data: { name: 'Daniele Borghi',   email: 'daniborghi@outlook.com',         password: hash('changeme!'), role: UserRole.LANDLORD, active: true } }),
    prisma.user.create({ data: { name: 'Kerem Atasoy',     email: 'kkatasoy@gmail.com',             password: hash('changeme!'), role: UserRole.LANDLORD, active: true } }),
    prisma.user.create({ data: { name: 'Neil Andrew',      email: 'mr.neil.andrew@gmail.com',       password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07977538180',  active: true } }),
    prisma.user.create({ data: { name: 'Ruby Huang',       email: 'Ruby.h.huang@outlook.com',       password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07441394567',  active: true } }),
    prisma.user.create({ data: { name: 'Olivier Douala',   email: 'olivier.douala@gmail.com',       password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07537930030',  active: true } }),
    prisma.user.create({ data: { name: 'Nikolaus Springer',email: 'nspringer@mac.com',              password: hash('changeme!'), role: UserRole.LANDLORD, phone: '4915201044090',active: true } }),
    prisma.user.create({ data: { name: 'Michael Lennox',   email: 'carolinejlennox@gmail.com',      password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07816845872',  active: true } }),
    prisma.user.create({ data: { name: 'Olamipo Macaulay', email: 'lamisylish@gmail.com',           password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07932506484',  active: true } }),
    prisma.user.create({ data: { name: 'Saj',              email: 'Junkmora@gmail.com',             password: hash('changeme!'), role: UserRole.LANDLORD, phone: '07956449877',  active: true } }),
  ])
  console.log('  ✓ Landlord users created')

  // ── Landlord records ──────────────────────────────────────────────────────
  console.log('  → Seeding landlord records...')
  const [
    bipin, nick, john, nicola, dean, tom_miller, phil,
    laura, giulia, rachel_n, jack, sharon, sandy, daniele,
    kerem, neil, ruby, olivier, nikolaus, michael, olamipo, saj,
  ] = await Promise.all([
    prisma.landlord.create({ data: { userId: bipin_u.id,     firstName: 'Bipin',    lastName: 'Uka',         phone: '07725897240',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: nick_u.id,      firstName: 'Nick',     lastName: 'Stainthorpe', phone: '07813082463',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: john_u.id,      firstName: 'John',     lastName: 'Hellerman',   phone: '07887562672',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: nicola_u.id,    firstName: 'Nicola',   lastName: 'Pocock',      phone: '07587950721',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: dean_u.id,      firstName: 'Dean',     lastName: 'Foden',       phone: '07526402846',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: tom_miller_u.id,firstName: 'Tom',      lastName: 'Miller',      phone: '32494944486',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: phil_u.id,      firstName: 'Phil',     lastName: 'Orme',        phone: '6591775992',   preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: laura_u.id,     firstName: 'Laura',    lastName: 'Bussa',       phone: '18573529784',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: giulia_u.id,    firstName: 'Giulia',   lastName: 'Cerundolo',                          preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: rachel_u.id,    firstName: 'Rachel',   lastName: 'North',                              preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true,  statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: jack_u.id,      firstName: 'Jack',     lastName: 'Kemp',        phone: '07464295639',  preferredContact: 'phone', serviceLevel: 'FULL_MANAGEMENT', ukResident: true,  statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: sharon_u.id,    firstName: 'Sharon',   lastName: 'Savory',      phone: '07801552560',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true,  statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: sandy_u.id,     firstName: 'Sandy',    lastName: 'Cook',        phone: '07957340457',  preferredContact: 'phone', serviceLevel: 'FULL_MANAGEMENT', ukResident: true,  statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: daniele_u.id,   firstName: 'Daniele',  lastName: 'Borghi',                             preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: kerem_u.id,     firstName: 'Kerem',    lastName: 'Atasoy',                             preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: neil_u.id,      firstName: 'Neil',     lastName: 'Andrew',      phone: '07977538180',  preferredContact: 'whatsapp', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: ruby_u.id,      firstName: 'Ruby',     lastName: 'Huang',       phone: '07441394567',  preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: true,  statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: olivier_u.id,   firstName: 'Olivier',  lastName: 'Douala',      phone: '07537930030',  preferredContact: 'whatsapp', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: nikolaus_u.id,  firstName: 'Nikolaus', lastName: 'Springer',    phone: '4915201044090',preferredContact: 'email', serviceLevel: 'FULL_MANAGEMENT', ukResident: false, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: michael_u.id,   firstName: 'Michael',  lastName: 'Lennox',      phone: '07816845872',  preferredContact: 'phone', serviceLevel: 'FULL_MANAGEMENT', ukResident: true,  statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: olamipo_u.id,   firstName: 'Olamipo',  lastName: 'Macaulay',    phone: '07932506484',  preferredContact: 'whatsapp', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
    prisma.landlord.create({ data: { userId: saj_u.id,       firstName: 'Saj',      lastName: '',            phone: '07956449877',  preferredContact: 'whatsapp', serviceLevel: 'FULL_MANAGEMENT', ukResident: true, statementEmail: true, statementFrequency: 'monthly' } }),
  ])
  console.log('  ✓ Landlord records created')

  // ── Demo tenants ──────────────────────────────────────────────────────────
  const [tom, priya] = await Promise.all([
    prisma.tenant.create({ data: { userId: tom_user.id, firstName: 'Tom', lastName: 'Whitfield', dob: new Date('1992-03-15'), phone: '+447700900005', employer: 'Monzo Bank', jobTitle: 'Senior Software Engineer', annualSalary: 75000, referencingStatus: ReferencingStatus.PASSED } }),
    prisma.tenant.create({ data: { userId: priya_user.id, firstName: 'Priya', lastName: 'Patel', dob: new Date('1995-07-22'), phone: '+447700900006', employer: 'Deliveroo', jobTitle: 'Product Designer', annualSalary: 58000, referencingStatus: ReferencingStatus.IN_PROGRESS } }),
  ])

  // ── Contractor ────────────────────────────────────────────────────────────
  const contractor = await prisma.contractor.create({
    data: { name: 'Dave Kowalski', companyName: 'East London Plumbing Co', trade: 'Plumbing', phone: '07700900010', email: 'dave@eastlondonplumbing.co.uk', address: '12 Hackney Road, E2 7NS', insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), gasSafeNumber: 'GS123456', rating: 4.5, active: true },
  })

  // ── Properties ────────────────────────────────────────────────────────────
  // NOTE: Prices are estimates — update via dashboard.
  // ★ = AVAILABLE  ·  rest = LET
  console.log('  → Seeding properties...')

  const [
    // Bipin Uka
    jocelyn,
    // Nick Stainthorpe
    eagle, enfield, pentonville,
    // John Hellerman
    pantiles, gade, paterson,
    // Nicola Pocock
    jeddo, westgreen,
    // Dean Foden
    citywalk,
    // Tom Miller
    richmond,
    // Phil Orme
    eyot,
    // Laura Bussa
    lincoln,
    // Giulia Cerundolo
    woodclose,
    // Rachel North
    crayford,
    // Jack Kemp
    anthony,
    // Sharon Savory
    holly,
    // Sandy Cook
    greencourt,
    // Daniele Borghi
    gainsborough,
    // Kerem Atasoy
    chapter,
    // Neil Andrew
    winns, kingsfield,
    // Ruby Huang
    pelling,
    // Olivier Douala ★ AVAILABLE
    baron,
    // Nikolaus Springer
    treetop,
    // Michael Lennox
    albany,
    // Olamipo Macaulay
    dorset,
    // Saj ★ AVAILABLE
    boundary,
  ] = await Promise.all([

    // ── Bipin Uka ─────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '24-jocelyn-house-n1', addressLine1: '24 Jocelyn House', area: 'Islington', town: 'London', postcode: 'N1 0SD', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: bipin.id } }),

    // ── Nick Stainthorpe ──────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '44-eagle-mansions-n16', addressLine1: '44 Eagle Mansions', area: 'Stoke Newington', town: 'London', postcode: 'N16 8AU', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: nick.id } }),
    prisma.property.create({ data: { slug: '64-enfield-cloisters-road-n1', addressLine1: '64 Enfield Cloisters Road', area: 'Hoxton', town: 'London', postcode: 'N1 6LD', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: nick.id } }),
    prisma.property.create({ data: { slug: '101-pentonville-road-n1', addressLine1: '101 Pentonville Road', area: 'Islington', town: 'London', postcode: 'N1 9LF', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: nick.id } }),

    // ── John Hellerman ────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '1-pantiles-bushey-heath-wd23', addressLine1: '1 Pantiles', addressLine2: 'Bushey Heath', area: 'Bushey', town: 'Watford', postcode: 'WD23 1LS', propertyType: PropertyType.HOUSE, bedrooms: 3, bathrooms: 1, receptions: 2, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: john.id } }),
    prisma.property.create({ data: { slug: '22-gade-close-watford-wd18', addressLine1: '22 Gade Close', area: 'Watford', town: 'Watford', postcode: 'WD18 7JH', propertyType: PropertyType.HOUSE, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: john.id } }),
    prisma.property.create({ data: { slug: '10-paterson-court-ec1v', addressLine1: '10 Paterson Court', area: 'Clerkenwell', town: 'London', postcode: 'EC1V 9EX', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: john.id } }),

    // ── Nicola Pocock ─────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '23-jeddo-road-w12', addressLine1: '23 Jeddo Road', area: "Shepherd's Bush", town: 'London', postcode: 'W12 9EB', propertyType: PropertyType.HOUSE, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: nicola.id } }),
    prisma.property.create({ data: { slug: '123-west-green-road-n15', addressLine1: '123 West Green Road', area: 'Seven Sisters', town: 'London', postcode: 'N15 3QR', propertyType: PropertyType.FLAT, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: nicola.id } }),

    // ── Dean Foden ────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: 'flat-18-city-walk-apartments-ec1v', addressLine1: 'Flat 18, City Walk Apartments', addressLine2: '29 Seward Street', area: 'Clerkenwell', town: 'London', postcode: 'EC1V 3RF', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: dean.id } }),

    // ── Tom Miller ────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '128-richmond-road-e8', addressLine1: '128 Richmond Road', area: 'Hackney', town: 'London', postcode: 'E8 3HW', propertyType: PropertyType.HOUSE, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: tom_miller.id } }),

    // ── Phil Orme ─────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '84-eyot-house-se16', addressLine1: '84 Eyot House', area: 'Bermondsey', town: 'London', postcode: 'SE16 4BP', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: phil.id } }),

    // ── Laura Bussa ───────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '7-lincoln-court-n16', addressLine1: '7 Lincoln Court', addressLine2: 'Bethune Road', area: 'Stoke Newington', town: 'London', postcode: 'N16 5EB', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: laura.id } }),

    // ── Giulia Cerundolo ──────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '19-wood-close-e2', addressLine1: '19 Wood Close', area: 'Bethnal Green', town: 'London', postcode: 'E2 6ET', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: giulia.id } }),

    // ── Rachel North ──────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '59c-crayford-road-n7', addressLine1: '59C Crayford Road', area: 'Holloway', town: 'London', postcode: 'N7 0NE', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: rachel_n.id } }),

    // ── Jack Kemp ─────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '22-anthony-house-e5', addressLine1: '22 Anthony House', area: 'Clapton', town: 'London', postcode: 'E5 8GZ', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: jack.id } }),

    // ── Sharon Savory ─────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: 'flat-12-50-holly-street-e8', addressLine1: 'Flat 12, 50 Holly Street', area: 'Hackney', town: 'London', postcode: 'E8 3HS', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: sharon.id } }),

    // ── Sandy Cook ────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '42-green-court-bethnal-green-road-e1', addressLine1: '42 Green Court', addressLine2: '200 Bethnal Green Road', area: 'Bethnal Green', town: 'London', postcode: 'E1 4LD', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: sandy.id } }),

    // ── Daniele Borghi ────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: 'flat-37-east-gainsborough-studios-n1', addressLine1: 'Flat 37, East Gainsborough Studios', addressLine2: 'Poole Street', area: 'Hoxton', town: 'London', postcode: 'N1 5ED', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: daniele.id } }),

    // ── Kerem Atasoy ──────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '15-chapter-house-e2', addressLine1: '15 Chapter House', area: 'Bethnal Green', town: 'London', postcode: 'E2 6GS', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: kerem.id } }),

    // ── Neil Andrew ───────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '28-winns-terrace-e17', addressLine1: '28 Winns Terrace', area: 'Walthamstow', town: 'London', postcode: 'E17 5EJ', propertyType: PropertyType.HOUSE, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: neil.id } }),
    prisma.property.create({ data: { slug: '8-kingsfield-house-n16', addressLine1: '8 Kingsfield House', addressLine2: 'Victorian Grove', area: 'Stoke Newington', town: 'London', postcode: 'N16 8EY', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: neil.id } }),

    // ── Ruby Huang ────────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '7-pelling-e14', addressLine1: '7 Pelling', area: 'Limehouse', town: 'London', postcode: 'E14 7EN', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: ruby.id } }),

    // ── Olivier Douala ★ AVAILABLE ────────────────────────────────────────
    prisma.property.create({ data: { slug: 'flat-11-baron-court-n1', addressLine1: 'Flat 11, Baron Court', addressLine2: '13-17 Baron Street', area: 'Islington', town: 'London', postcode: 'N1 9HP', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.AVAILABLE, listingType: ListingType.RENT, publishedOnWeb: true, landlordId: olivier.id } }),

    // ── Nikolaus Springer ─────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '3-treetop-mews-nw6', addressLine1: '3 Treetop Mews', area: 'West Hampstead', town: 'London', postcode: 'NW6 7BL', propertyType: PropertyType.HOUSE, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: nikolaus.id } }),

    // ── Michael Lennox ────────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '8-albany-court-e1', addressLine1: '8 Albany Court', addressLine2: 'Plumbers Row', area: 'Whitechapel', town: 'London', postcode: 'E1 1EP', propertyType: PropertyType.FLAT, bedrooms: 1, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: michael.id } }),

    // ── Olamipo Macaulay ──────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '113-dorset-road-e7', addressLine1: '113 Dorset Road', area: 'Forest Gate', town: 'London', postcode: 'E7 8PX', propertyType: PropertyType.HOUSE, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.LET, listingType: ListingType.RENT, publishedOnWeb: false, landlordId: olamipo.id } }),

    // ── Saj ★ AVAILABLE ───────────────────────────────────────────────────
    prisma.property.create({ data: { slug: '122b-boundary-road-nw8', addressLine1: '122B Boundary Road', area: "St John's Wood", town: 'London', postcode: 'NW8 0RH', propertyType: PropertyType.FLAT, bedrooms: 2, bathrooms: 1, receptions: 1, status: PropertyStatus.AVAILABLE, listingType: ListingType.RENT, publishedOnWeb: true, landlordId: saj.id } }),
  ])
  console.log(`  ✓ Properties created (${27} total, 2 available)`)

  // ── Listings (available properties only) ──────────────────────────────────
  // ⚠ Prices are estimates — please update via the dashboard.
  console.log('  → Seeding listings for available properties...')
  await Promise.all([
    prisma.listing.create({
      data: {
        propertyId: baron.id,
        price: 195000, // £1,950 pcm — update if different
        priceFrequency: 'pcm',
        availableFrom: now,
        shortDescription: '1-bed flat in Islington. Well-presented, great transport links. Available now.',
        description: 'A well-presented one-bedroom flat in Baron Court, a quiet residential building on Baron Street in Islington. Bright throughout, with a modern kitchen and bathroom. The area is well-connected — Angel tube (Northern line) is a short walk, with buses along Pentonville Road.',
        furnished: false,
        parking: false,
        garden: false,
        balcony: false,
        petsAllowed: false,
        dssConsidered: false,
        features: ['Double glazing', 'Secure entry', 'Close to Angel tube'],
        publishRightmove: true,
      },
    }),
    prisma.listing.create({
      data: {
        propertyId: boundary.id,
        price: 240000, // £2,400 pcm — update if different
        priceFrequency: 'pcm',
        availableFrom: now,
        shortDescription: '2-bed flat in St John\'s Wood. Spacious, well-located, available now.',
        description: 'A spacious two-bedroom flat on Boundary Road, NW8. Well-presented throughout with good natural light. St John\'s Wood is one of London\'s most desirable neighbourhoods — quiet, leafy, and excellently connected via the Jubilee line.',
        furnished: false,
        parking: false,
        garden: false,
        balcony: false,
        petsAllowed: false,
        dssConsidered: false,
        features: ['Double glazing', 'Secure entry', 'St John\'s Wood tube nearby'],
        publishRightmove: true,
      },
    }),
  ])
  console.log('  ✓ Listings created')

  // ── Demo tenancy data (for dashboard testing) ─────────────────────────────
  console.log('  → Seeding demo tenancy data...')
  const sixMonthsAgo   = new Date(now.getTime() - 6  * 30 * 24 * 60 * 60 * 1000)
  const sixMonthsAhead = new Date(now.getTime() + 6  * 30 * 24 * 60 * 60 * 1000)
  const eightMonthsAgo = new Date(now.getTime() - 8  * 30 * 24 * 60 * 60 * 1000)
  const twentyFiveDaysAhead = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000)

  const [tenancy_richmond, tenancy_woodclose] = await Promise.all([
    prisma.tenancy.create({ data: { propertyId: richmond.id, landlordId: tom_miller.id, startDate: sixMonthsAgo, endDate: sixMonthsAhead, rentAmount: 200000, rentFrequency: 'monthly', depositAmount: 300000, depositScheme: 'TDS', depositRef: 'TDS-2025-001', status: TenancyStatus.ACTIVE, notes: 'Good tenant. Pays on time.' } }),
    prisma.tenancy.create({ data: { propertyId: woodclose.id, landlordId: giulia.id, startDate: eightMonthsAgo, endDate: twentyFiveDaysAhead, rentAmount: 175000, rentFrequency: 'monthly', depositAmount: 262500, depositScheme: 'DPS', depositRef: 'DPS-2025-002', status: TenancyStatus.EXPIRING_SOON, notes: 'Renewal discussion needed.' } }),
  ])
  await Promise.all([
    prisma.tenancyTenant.create({ data: { tenancyId: tenancy_richmond.id, tenantId: tom.id, isPrimary: true } }),
    prisma.tenancyTenant.create({ data: { tenancyId: tenancy_woodclose.id, tenantId: priya.id, isPrimary: true } }),
  ])

  // Rent payments
  const rentPayments: Promise<any>[] = []
  for (let i = 6; i >= 0; i--) {
    const due = new Date(sixMonthsAgo); due.setMonth(due.getMonth() + (6 - i))
    const paid = i > 0
    rentPayments.push(prisma.rentPayment.create({ data: { tenancyId: tenancy_richmond.id, dueDate: due, amount: 200000, amountPaid: paid ? 200000 : 0, paidDate: paid ? new Date(due.getTime() + 2 * 24 * 60 * 60 * 1000) : null, status: paid ? PaymentStatus.PAID : PaymentStatus.PENDING, reference: paid ? `BACS-TOM-${7-i}` : null } }))
  }
  for (let i = 8; i >= 0; i--) {
    const due = new Date(eightMonthsAgo); due.setMonth(due.getMonth() + (8 - i))
    const paid = i > 0
    rentPayments.push(prisma.rentPayment.create({ data: { tenancyId: tenancy_woodclose.id, dueDate: due, amount: 175000, amountPaid: paid ? 175000 : 0, paidDate: paid ? new Date(due.getTime() + 3 * 24 * 60 * 60 * 1000) : null, status: paid ? PaymentStatus.PAID : PaymentStatus.LATE, reference: paid ? `BACS-PRI-${9-i}` : null, notes: !paid ? 'Overdue. Chaser sent.' : null } }))
  }
  await Promise.all(rentPayments)
  console.log('  ✓ Demo tenancy data created')

  // ── Maintenance ───────────────────────────────────────────────────────────
  console.log('  → Seeding maintenance...')
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
  await Promise.all([
    prisma.maintenanceRequest.create({ data: { propertyId: richmond.id, category: MaintenanceCategory.PLUMBING, priority: MaintenancePriority.ROUTINE, status: MaintenanceStatus.COMPLETED, title: 'Dripping tap in bathroom', description: 'Hot tap has been dripping for about a week.', reportedByTenant: true, reportedAt: threeWeeksAgo, completedAt: new Date(threeWeeksAgo.getTime() + 4 * 24 * 60 * 60 * 1000), contractorId: contractor.id, quoteAmount: 9500, quoteApproved: true, invoiceAmount: 9500, notes: 'Washer replaced.' } }),
    prisma.maintenanceRequest.create({ data: { propertyId: woodclose.id, category: MaintenanceCategory.HEATING, priority: MaintenancePriority.URGENT, status: MaintenanceStatus.ASSIGNED, title: 'Boiler not igniting — no heating or hot water', description: 'Complete loss of heating and hot water. Boiler showing error code E1.', reportedByTenant: true, reportedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), contractorId: contractor.id, quoteAmount: 45000, quoteApproved: true, notes: 'Contractor attending tomorrow AM.' } }),
  ])
  console.log('  ✓ Maintenance created')

  // ── Compliance ────────────────────────────────────────────────────────────
  console.log('  → Seeding compliance...')
  const oneMonthAhead  = new Date(now.getTime() + 30  * 24 * 60 * 60 * 1000)
  const threeYearsAhead = new Date(now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000)
  const fiveYearsAhead  = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000)
  const twoYearsAgo     = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
  const gasIssue        = new Date(oneMonthAhead.getTime() - 365 * 24 * 60 * 60 * 1000)

  // Add compliance for the two available properties + demo tenancy properties
  for (const prop of [baron, boundary, richmond, woodclose]) {
    await Promise.all([
      prisma.complianceItem.create({ data: { propertyId: prop.id, type: ComplianceType.GAS_SAFETY, issueDate: gasIssue, expiryDate: oneMonthAhead, notes: 'Due for renewal.' } }),
      prisma.complianceItem.create({ data: { propertyId: prop.id, type: ComplianceType.EICR, issueDate: twoYearsAgo, expiryDate: threeYearsAhead } }),
      prisma.complianceItem.create({ data: { propertyId: prop.id, type: ComplianceType.EPC, issueDate: twoYearsAgo, expiryDate: fiveYearsAhead } }),
    ])
  }
  console.log('  ✓ Compliance created')

  // ── Inspections ───────────────────────────────────────────────────────────
  const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  await Promise.all([
    prisma.inspection.create({ data: { propertyId: richmond.id, type: InspectionType.MID_TERM, status: InspectionStatus.COMPLETED, scheduledAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), conductedBy: 'Claire Bruce', sentToLandlord: true, notes: 'Property in good condition. No issues.' } }),
    prisma.inspection.create({ data: { propertyId: woodclose.id, type: InspectionType.MID_TERM, status: InspectionStatus.SCHEDULED, scheduledAt: twoWeeksAhead, conductedBy: 'Bradley', notes: 'Mid-term inspection. Also discuss renewal.' } }),
  ])

  // ── Enquiries ─────────────────────────────────────────────────────────────
  console.log('  → Seeding enquiries...')
  await Promise.all([
    prisma.enquiry.create({ data: { propertyId: baron.id, firstName: 'Marcus', lastName: 'Webb', email: 'marcus.webb@gmail.com', phone: '07700900020', message: 'Interested in the Baron Court flat — can I book a viewing this week?', source: EnquirySource.WEBSITE, stage: ApplicantStage.ENQUIRY, minBeds: 1, maxBudget: 200000, moveDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } }),
    prisma.enquiry.create({ data: { propertyId: boundary.id, firstName: 'Saoirse', lastName: 'Murphy', email: 'saoirse.m@outlook.com', phone: '07700900021', message: 'Is the Boundary Road flat still available? Looking to move in soon.', source: EnquirySource.RIGHTMOVE, stage: ApplicantStage.VIEWING_BOOKED, minBeds: 2, maxBudget: 250000, moveDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) } }),
    prisma.enquiry.create({ data: { firstName: 'Daniel', lastName: 'Okafor', email: 'd.okafor@hotmail.com', phone: '07700900022', message: 'Looking for a 1-bed in Islington or Hackney, budget up to £2,000 pcm. Anything coming up?', source: EnquirySource.WORD_OF_MOUTH, stage: ApplicantStage.ENQUIRY, minBeds: 1, maxBudget: 200000, moveDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) } }),
  ])
  console.log('  ✓ Enquiries created')

  // ── Notifications ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.notification.create({ data: { userId: bradley.id, type: 'RENT_ARREARS', title: 'Rent overdue — 19 Wood Close', message: '19 Wood Close rent is overdue. Amount: £1,750. Chaser needed.', link: '/dashboard/finance/rent', read: false } }),
    prisma.notification.create({ data: { userId: claire.id, type: 'LEASE_EXPIRY', title: 'Tenancy expiring — 19 Wood Close', message: 'Giulia Cerundolo\'s property tenancy expires in 25 days. Renewal discussion needed.', link: '/dashboard/tenancies', read: false } }),
    prisma.notification.create({ data: { userId: bradley.id, type: 'NEW_ENQUIRY', title: 'New enquiry — Baron Court', message: 'Marcus Webb has enquired about Flat 11, Baron Court.', link: '/dashboard/applicants', read: false } }),
    prisma.notification.create({ data: { userId: bradley.id, type: 'NEW_ENQUIRY', title: 'New enquiry — Boundary Road', message: 'Saoirse Murphy has enquired about 122B Boundary Road.', link: '/dashboard/applicants', read: false } }),
  ])

  console.log('\n✅ Seed complete!')
  console.log('\n📋 Login credentials:')
  console.log('  Admin  : bradley@centralgatestates.co.uk / password123')
  console.log('  Admin  : claire@centralgatestates.co.uk  / password123')
  console.log('  Tenant : tom@example.com                 / password123')
  console.log('  Tenant : priya@example.com               / password123')
  console.log('\n🏠 Available listings:')
  console.log('  Flat 11, Baron Court, 13-17 Baron Street, N1 9HP  — £1,950 pcm (estimate)')
  console.log('  122B Boundary Road, NW8 0RH                       — £2,400 pcm (estimate)')
  console.log('\n⚠  Update prices via the dashboard — these are estimates.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
