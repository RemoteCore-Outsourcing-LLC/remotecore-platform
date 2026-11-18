# RemoteCore Outsourcing platform

The website and recruiting platform for RemoteCore Outsourcing LLC.
Owned by RemoteCore Outsourcing LLC.

- Next.js (App Router, TypeScript), hosted on Vercel
- Supabase for logins, the database and private file storage
- Resend for emails, Stripe for payments

## Run it on a computer

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values
3. `npm run dev`, then open http://localhost:3000

This repository is public. Never commit a key, password or `.env.local`.

## Where things are

| Folder | What is in it |
|---|---|
| `src/app/(site)` | The public website: home, services, find opportunities, hire talent, talent marketplace, about, FAQ, contact, login and sign up pages |
| `src/app/(portal)/portal` | Logged in screens for job seekers and employers (one portal, the menu changes by account type) |
| `src/app/(portal)/portal/admin` | The admin dashboard: users, candidates, jobs, applications, inbox, billing, website settings, categories |
| `src/app/api` | Form posts, the Stripe webhook, the weekly job alert job and the stop alerts link |
| `src/lib/email` | Every email the platform sends (`templates.ts` holds the words) |
| `src/lib/billing.ts` | Invoices, Stripe Checkout, payments and refunds |
| `src/lib/content.ts`, `src/lib/heroes.ts` | Default page text. The admin Website screen overrides most of it |
| `supabase/migrations` | The database, in order. Run a new file in the Supabase SQL editor to change the database |

The weekly job alert schedule is in `vercel.json`.
