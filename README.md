# Clarity Expense Tracker

A personal finance dashboard built with Next.js, Clerk, Prisma and PostgreSQL.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Clerk and database values.
3. Run `npx prisma generate`.
4. Start locally with `npm run dev`.

## Deployment

Deploy on Vercel with the project root set to the repository root. Configure `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` in the Vercel project settings.
