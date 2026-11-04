# Clarity — consolidated development package

This is the single consolidated Next.js project for Clarity. It combines the work from the earlier foundation and development rounds. Continue using this folder as the only project; do not combine it with older ZIPs.

## Stack
- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4
- Clerk authentication
- PostgreSQL + Prisma ORM
- Recharts, Radix UI and Lucide

## Current implementation
- App Router project and dashboard UI (Overview, Transactions, Budgets, Categories, Analytics)
- Clerk sign-in/sign-up routes and protected application routes
- Prisma PostgreSQL schema for profiles, salaries, transactions, budgets and categories
- Authenticated, per-account API routes for profile, transactions, salaries, budgets and categories
- Zod request validation and account ownership checks in API handlers
- Dashboard currently fetches and displays saved transactions, categories and budgets; add-transaction flow posts to the API

## Important incomplete items
This is a consolidated development build, **not yet a production-ready finished product**. In particular, budget creation/editing UI, salary management UI, transaction edit/delete UI, category rename/delete UI, functional exports, automated integration tests, deployment configuration and full responsive/device QA still require completion. Some dashboard labels and comparison figures are presentation placeholders. Do not treat them as verified financial analytics.

No production database has been configured or connected. Do not enter real financial data until the deployment and persistence tests pass.

## Local setup
1. Install Node.js 22 LTS or newer.
2. Create a new development PostgreSQL database (Neon is supported).
3. Create a separate Clerk development application.
4. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`.
5. Run `npm install`.
6. Run `npx prisma generate`.
7. Run `npx prisma migrate dev --name init`.
8. Run `npm run dev` and open `http://localhost:3000`.

## Deployment
Deploy this Next.js application to Vercel or another Node.js-compatible host. GitHub Pages is static hosting and cannot run the Next.js server APIs or Prisma backend. Configure the same environment variables in the hosting provider, then run Prisma migrations against the **new development/production database** before enabling user access.

## Existing Supabase data protection
- The existing Supabase project is not referenced by this codebase and must remain untouched.
- Use a separate new PostgreSQL database while developing and testing.
- When ready, export the existing `clarity_user_data` row(s) from Supabase and retain the original JSON `payload` unchanged as a backup.
- Write and test a one-time import/mapping script against a copy of that export. Validate row counts, dates, categories, salary values, transaction totals and monthly totals.
- Keep the original Supabase project and an offline export until the owner has tested the new application on Mac and iPhone and explicitly approves cutover.
- Authentication passwords are not migrated as ordinary database fields; plan account migration separately and securely.

## Verification status
The source archive and project structure have been consolidated. This environment did not have `node_modules` installed, so a full dependency install, TypeScript build, live database test and provider authentication test have **not** been completed here. Do not interpret archive creation as proof of production readiness.
