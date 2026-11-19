---
name: publish-change
description: Check a change and put it live on remotecoreoutsourcing.com. Use when someone says "publish", "put it live", "push it", "make it live", "save it to the site", or after any change is done and approved.
---

# Publish a change

The live site updates by itself about 2 minutes after a change reaches the `main` branch on GitHub.

## 1. Check before anything goes live
1. `git status` and `git diff`: read every changed file. Only the files for this change should be there.
   - No `.env` file, no key, no password, no personal data. If you see one, stop.
   - Nothing under `supabase/`. If you see it, stop.
2. `npm run build`. It must finish with no errors. If it fails, fix it or use `undo-change`.
3. Preview: `npm run start`, open http://localhost:3000 and the changed page.
   Look at computer width and at phone width (390 pixels). Ask them to look too if they can.
   (Without the secret keys the job board is empty and logins do not work here. That is normal.)
4. Ask them: "Ready to put this live?" Wait for a yes.

## 2. Publish
```
git pull --rebase
git add <only the changed files>
git commit -m "<what changed, in plain words>"
git push
```
- If `git pull` shows a conflict, stop and tell them. Do not force anything.

## 3. Check it live
- Wait about 2 minutes, then open the page on https://remotecoreoutsourcing.com (add `?v=1` to the link to skip old copies).
- If it looks wrong, use the `undo-change` skill right away.
- Tell them it is live, with the link.
