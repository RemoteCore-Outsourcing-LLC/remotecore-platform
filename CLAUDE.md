# RemoteCore Outsourcing platform: rules for Claude

This is the website and recruiting platform of RemoteCore Outsourcing LLC. The people asking you
for changes run the business. They are not programmers.

## How to talk to them
- Plain, short sentences. No code words unless you explain them in the same sentence.
- Before you change anything, say in one or two lines what you will change and where it shows on the site.
- After a change, tell them how to look at it (which page, which link) before you publish.
- Ask before publishing. Publishing puts the change on the live site for everyone.

## First question for every change: can the admin dashboard do it?
Many things are changed in the admin dashboard, with no code and no publishing:
Log in at remotecoreoutsourcing.com, then Admin, then **Website**. It holds:
- company phone, email, address and social links
- the announcement bar at the top of the site
- the heading and intro text of each page
- the services lists, the FAQ, and the testimonials section on the homepage
Jobs, candidates, employers, invoices and team logins are all in the admin dashboard too.
If the dashboard can do it, tell them where to click instead of changing code.
Text saved in the dashboard wins over the text in the code, so a code change to those parts shows nothing.

## Skills in this folder
Use the matching skill in `.claude/skills/`:
- `change-text`: words or headings on a page
- `swap-image`: replace or add a photo or picture
- `add-section-or-page`: a new block on a page, or a new page, in the same look
- `change-email`: the words in an email the platform sends
- `publish-change`: check a change and put it live
- `undo-change`: take back the last change if something looks wrong

## Safety rules, never break these
1. **This repository is PUBLIC.** Anyone can read it. Never write a key, password, token or
   personal data into any file. Never commit `.env.local` or any `.env` file. Never print their values.
2. **Never touch the database.** Do not write or run SQL, migrations, or anything in `supabase/`.
   Do not change files in `src/lib/supabase`, `src/lib/billing.ts`, `src/app/api`, or `src/middleware.ts`.
   If a request needs any of these, stop and tell them it needs their developer.
3. **Never touch DNS, Cloudflare, Vercel settings, Stripe settings, or email settings.**
4. **Resumes, voice intros and documents stay private.** Never make a storage bucket or file public.
5. **Logins and payments** (anything under `src/app/(portal)`, `src/app/auth`, the login and register pages):
   only text changes. No changes to how they work.
6. **Always run `npm run build` before publishing.** If it fails, fix it or undo. Never publish a failing build.
7. **Check every changed page at phone width** (390 pixels wide) as well as computer width.
8. **Never use** `git push --force`, `git reset --hard` on pushed work, or delete branches on GitHub.
   To take something back, use the `undo-change` skill (it adds a new "undo" save, it does not erase history).
9. A price, phone number or other fact often shows in several places (pages, FAQ, footer, Terms, emails).
   Search the whole `src/` folder for it and list every place before changing one.
10. One change at a time. Publish it, check it live, then start the next one.

## Where things are
| What | File |
|---|---|
| Public pages (one folder per page) | `src/app/(site)/<page>/page.tsx`, the homepage is `src/app/(site)/page.tsx` |
| Menu, company name, address, social links | `src/lib/site.ts` |
| Default page headings (the dashboard can override) | `src/lib/heroes.ts` |
| Default services and FAQ (the dashboard can override) | `src/lib/content.ts` |
| Header, footer, shared blocks | `src/components/site/` |
| Look of the public site (colours, fonts, spacing) | `src/app/(site)/site.css` |
| Photos and pictures | `public/assets/`, logo in `public/brand/` |
| Email words | `src/lib/email/templates.ts` |
| Resume autofill (reads a resume, fills empty profile parts with Claude Haiku, about $1 per 1,000 resumes; off when ANTHROPIC_API_KEY is empty) | `src/lib/resume/autofill.ts`, `src/app/(portal)/portal/profile/autofill-action.ts` |
| Google page list | `src/app/sitemap.ts` |

## Look and feel
- Colours come from the variables at the top of `site.css` (`--teal`, `--plum`, `--night`, `--sc-ink` and others).
  Use them. Never type a new colour code.
- Reuse the classes already on the site (`sec`, `wrap`, `head`, `card`, `cards`, `split`, `btn btn--main`).
  Copy a similar block from another page instead of inventing a new design.
- Headings use Title Case, like the rest of the site.

## Running it on this computer
- `npm install` once.
- Without `.env.local` (the secret keys), the public pages still build and show with the built in text.
  The job board shows empty and logging in does not work on this computer. That is normal.
- Preview: `npm run build` then `npm run start`, and open http://localhost:3000 .
- The live site updates by itself about 2 minutes after a change reaches the `main` branch on GitHub.
