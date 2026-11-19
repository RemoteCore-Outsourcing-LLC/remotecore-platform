---
name: change-text
description: Change words, headings, buttons or lists on a page of the RemoteCore website. Use when someone says "change the text", "fix this sentence", "update the heading", "reword", "add a line to", or pastes new copy for a page.
---

# Change text on the website

## 1. Check the admin dashboard first
These parts are edited in **Admin, then Website**, with no code:
page headings and intros, services lists, FAQ, company phone, email and address, social links,
announcement bar, testimonials. If the request is one of these, tell them where to click and stop.
(Text saved there wins over the code, so changing the code would show nothing.)

## 2. Find the text
- Search for a few exact words they gave you: `grep -rn "the words" src/`
- Pages live in `src/app/(site)/<page>/page.tsx`. Homepage: `src/app/(site)/page.tsx`.
- Menu labels: `src/lib/site.ts`. Footer: `src/components/site/Footer.tsx`.
- Shared blocks (trust list, closing sections): `src/components/site/Blocks.tsx`.
- If the same sentence shows in several places, ask which ones to change.

## 3. Change it
- Change only the words. Keep the tags, classes and layout around them as they are.
- Inside the code, quotes and apostrophes must stay valid. Use ’ (curly) in text, as the rest of the site does.
- Headings use Title Case.
- If you change a page title or description at the top of a page (`metadata`), keep it under 60 and 160 characters.

## 4. Check
- Run `npm run build`. It must finish with no errors.
- Show them the before and after text.
- Then use the `publish-change` skill.
