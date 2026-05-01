# Central Gate Estates — Claude Code Instructions

## Project
Full-stack Next.js 14 property agency site + management system. Public website + agent dashboard + tenant/landlord portals.

## Active Design Skills
Always apply these to all UI work:
- `/impeccable` — enforce design language from `.impeccable.md` before writing any UI code
- `/frontend-design` — distinctive typography, colour, spacing before code
- `/ui-ux-pro-max` — sector-appropriate visual style
- `/accessibility-review` — WCAG 2.2 AA check on all generated UI components

Design system lives in `.impeccable.md`. Read it before any frontend work.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Prisma ORM → Supabase PostgreSQL (project: sviaukiudjabnkbqkdjo, eu-west-1)
- NextAuth v4 with JWT sessions
- Import alias: `@/` → `src/`

## Key Rules
- No Inter, Roboto, Arial, or Space Grotesk — use Syne (display) + DM Sans (body)
- No generic blue buttons — primary = terracotta (#c4622d)
- No pure white (#fff) — use cream (#f5f2ee)
- No border-radius > 8px on cards, 4px on buttons
- Left-align hero text — never centred hero with a card overlay
- All prices in pence/integers in DB — format to £X,XXX for display
- API routes require role check via getServerSession
- Upload files to UPLOAD_DIR (env var), return public path
- Email via nodemailer with SMTP env vars

## Commands
- `npm run dev` — start dev server
- `npm run db:generate` — regenerate Prisma client after schema changes
- `npm run db:seed` — seed sample data
- `npm run db:studio` — Prisma Studio GUI
