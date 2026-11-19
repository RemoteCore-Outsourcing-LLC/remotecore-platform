---
name: add-section-or-page
description: Add a new section to a page, or a whole new page, on the RemoteCore website in the same look as the rest. Use when someone says "add a section", "add a new page", "add a block about", "make a page for".
---

# Add a section or a new page

## 1. Agree on the content first
Ask for, or write and show them: the heading, the text, any buttons and where they go, any image.
Do not start coding until they say the words are right.

## 2. A new section on an existing page
- Open the page in `src/app/(site)/<page>/page.tsx`.
- Find a section on any page that looks like what they want (cards, steps, two columns, a dark closing block).
  Copy its structure. Common parts:
  - `<section className="sec">` or `className="sec sec--pale"` (light grey background). Alternate them so sections stand apart.
  - `<div className="wrap">` keeps the width right.
  - `<div className="head"><h2>…</h2><p className="lede">…</p></div>` for a heading with intro.
  - `cards` with `card` items, `split` for two columns, `Steps` and `Close` from `src/components/site/Blocks.tsx`.
  - Buttons: `<a className="btn btn--main" href="/contact">…</a>`.
- Use only the colours in the variables at the top of `src/app/(site)/site.css`. Never a new colour code.
- Add `data-sc-in` to a block if the other blocks on the page have it (the soft fade in when scrolling).

## 3. A new page
- Make a folder `src/app/(site)/<page-name>/` with a `page.tsx`. Copy a simple page like `about/page.tsx` as the start.
- Set `metadata` at the top: `title` under 60 characters, `description` under 160.
- For a page heading, use `<PageHero page="<page-name>" />` and add the page to `HERO_PAGES` in `src/lib/heroes.ts`
  (label, path, eyebrow, title, lede). Then the heading can be edited from Admin, Website.
- Add the page to the list in `src/app/sitemap.ts` so Google finds it.
- If it belongs in the menu, add it in `nav` in `src/lib/site.ts`. Ask first: the menu is full, so it may fit better in the footer or under "For Talent".

## 4. Check
- Run `npm run build`. It must finish with no errors.
- Preview with `npm run start`. Look at the page at computer width and at phone width (390 pixels).
  Nothing may stick out to the side, and text must be readable.
- Then use the `publish-change` skill.
