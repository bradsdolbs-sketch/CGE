# Central Gate Estates — Property Management System

Full-stack lettings and property management platform for Central Gate Estates. Public website + agent CRM/PMS dashboard + tenant and landlord portals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS — Syne + DM Sans typography |
| Database | PostgreSQL via Supabase (project: `sviaukiudjabnkbqkdjo`, eu-west-1) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4, JWT sessions, role-based |
| Email | Nodemailer (SMTP) |
| Maps | Leaflet.js (react-leaflet) |
| File uploads | Local filesystem (swap `src/lib/upload.ts` for S3 in prod) |
| PDF | @react-pdf/renderer |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# → Fill in your DB password (see Environment Variables below)
# → Generate NEXTAUTH_SECRET (see below)

# 3. Generate Prisma client
npm run db:generate

# 4. Seed sample data
npm run db:seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | Supabase connection pooler URL | [Supabase Dashboard → Settings → Database](https://supabase.com/dashboard/project/sviaukiudjabnkbqkdjo/settings/database) — use the "Transaction pooler" string, replace `[YOUR-PASSWORD]` |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) | Same page — "Direct connection" string |
| `NEXTAUTH_URL` | Your app URL | `http://localhost:3000` for dev |
| `NEXTAUTH_SECRET` | Random secret for JWT signing | Run: `openssl rand -base64 32` |
| `SMTP_HOST` | SMTP server hostname | Your email provider |
| `SMTP_PORT` | SMTP port | Usually `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | SMTP username / email | Your email provider |
| `SMTP_PASS` | SMTP password | Your email provider |
| `UPLOAD_DIR` | Local path for file uploads | `./uploads` (create this directory) |

> **Tip for dev email**: Use [Mailtrap](https://mailtrap.io) (free) — it catches all outgoing email without delivering it.

---

## Default Login Accounts

After running `npm run db:seed`:

| Email | Password | Role | Access |
|---|---|---|---|
| `bradley@centralgatestates.co.uk` | `password123` | Admin | `/dashboard` — full access |
| `claire@centralgatestates.co.uk` | `password123` | Agent | `/dashboard` — full access |
| `tom@example.com` | `password123` | Tenant | `/portal/tenant` |
| `priya@example.com` | `password123` | Tenant | `/portal/tenant` |
| `landlord1@example.com` | `password123` | Landlord | `/portal/landlord` |
| `landlord2@example.com` | `password123` | Landlord | `/portal/landlord` |

---

## Key Routes

| Route | Description |
|---|---|
| `/` | Public homepage |
| `/properties` | Property listings with filters |
| `/properties/[slug]` | Single property detail + viewing form |
| `/landlords` | Landlord services page |
| `/tenants` | Tenant information + portal CTA |
| `/about` | Team + company story |
| `/contact` | Contact form + agent WhatsApp links |
| `/areas/[area]` | Neighbourhood guides (7 East London areas) |
| `/login` | Authentication |
| `/dashboard` | Agent/admin reporting overview |
| `/dashboard/properties` | Property management |
| `/dashboard/tenancies` | Tenancy management |
| `/dashboard/tenants` | Tenant CRM |
| `/dashboard/landlords` | Landlord CRM |
| `/dashboard/maintenance` | Maintenance requests |
| `/dashboard/compliance` | Compliance certificate tracker |
| `/dashboard/finance/rent` | Rent payment management |
| `/dashboard/finance/statements` | Landlord statements |
| `/dashboard/applicants` | Applicant pipeline |
| `/dashboard/inspections` | Property inspections |
| `/dashboard/contractors` | Contractor database |
| `/portal/tenant` | Tenant portal |
| `/portal/landlord` | Landlord portal |
| `/api/feed/rightmove` | Rightmove XML property feed |

---

## NPM Scripts

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Push schema changes to DB (no migration history)
npm run db:migrate   # Create and run a named migration
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio GUI (localhost:5555)
```

---

## Database

The schema is live on the Supabase CGE project (`sviaukiudjabnkbqkdjo`, eu-west-1). All tables and enums were created via the Supabase Management API.

**To reset and re-seed:**
```bash
node_modules/.bin/prisma db push --force-reset
npm run db:seed
```

**To run Prisma Studio** (visual DB browser):
```bash
npm run db:studio
```

---

## File Uploads

Files are stored locally at `./uploads/` during development.

```bash
mkdir uploads  # Create the uploads directory (gitignored)
```

For production, update `src/lib/upload.ts` to upload to S3/Cloudflare R2. The interface (`saveFile`, `deleteFile`, `getFileUrl`) stays the same — only the implementation changes.

---

## Email

Configure SMTP credentials in `.env.local`. The email utility is at `src/lib/email.ts`.

For local development without a real SMTP server, use [Mailtrap](https://mailtrap.io):
1. Sign up free at mailtrap.io
2. Go to Email Testing → Inboxes → SMTP Settings
3. Copy the credentials into `.env.local`

---

## Design System

The UI follows the design language defined in `.impeccable.md`:
- **Fonts**: Syne (display/headlines) + DM Sans (body/UI)
- **Primary colour**: Terracotta `#c4622d`
- **Background**: Cream `#f5f2ee`
- **Text**: Charcoal `#1a1a1a`
- **Design skills**: `/impeccable`, `/frontend-design`, `/ui-ux-pro-max`, `/auto-memory`, `/accessibility-review`

---

## 21st.dev Magic Components

To enable the `/ui` component command in Claude Code:
1. Get a free API key at [21st.dev/magic/console](https://21st.dev/magic/console)
2. Run: `npx @21st-dev/cli@latest install claude --api-key YOUR_KEY`
3. Restart Claude Code
4. Use `/ui [description]` to generate production-grade components

---

## Local Docker Database (alternative to Supabase)

If you prefer to run PostgreSQL locally instead of using Supabase:

```bash
# Start PostgreSQL in Docker
docker compose up -d

# Update .env.local DATABASE_URL to:
# postgresql://postgres:postgres@localhost:5432/cge

# Push schema and seed
npm run db:generate
node_modules/.bin/prisma db push
npm run db:seed
```

---

## Production Deployment

The app is designed to deploy to **Vercel** with **Supabase** as the database.

1. Push to GitHub
2. Import into Vercel
3. Set all environment variables from `.env.example` in Vercel dashboard
4. Set `NEXTAUTH_URL` to your production domain
5. Set `DIRECT_URL` and `DATABASE_URL` to Supabase production connection strings
6. For file uploads in production: swap `src/lib/upload.ts` for an S3-compatible implementation and set `NEXT_PUBLIC_UPLOAD_URL` accordingly

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Authentication pages
│   ├── (public)/              # Public website (no auth required)
│   │   ├── page.tsx           # Homepage
│   │   ├── properties/        # Listings + detail pages
│   │   ├── landlords/         # Landlord services
│   │   ├── tenants/           # Tenant information
│   │   ├── about/             # Team + company
│   │   ├── contact/           # Contact form
│   │   └── areas/[area]/      # Neighbourhood guides
│   ├── dashboard/             # Agent/admin CRM (AGENT/ADMIN role)
│   ├── portal/
│   │   ├── tenant/            # Tenant self-service portal
│   │   └── landlord/          # Landlord portal
│   └── api/                   # All API routes
├── components/
│   ├── ui/                    # Shared UI primitives
│   ├── layout/                # Navbar, Footer
│   ├── public/                # Public-facing components
│   └── dashboard/             # Dashboard-specific components
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth.ts                # NextAuth config
│   ├── email.ts               # Nodemailer email utility
│   └── upload.ts              # File upload utility
├── middleware.ts               # Route protection + role checks
└── types/index.ts             # Shared TypeScript types
prisma/
├── schema.prisma              # Database schema (19 models)
└── seed.ts                    # Sample data seed script
```
