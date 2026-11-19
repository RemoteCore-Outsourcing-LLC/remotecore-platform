---
name: undo-change
description: Take back the last change on the RemoteCore website if something looks wrong or broke. Use when someone says "undo", "go back", "put it back how it was", "something broke", "the site looks wrong after the change".
---

# Undo a change

## Not published yet (only on this computer)
- See what changed: `git status` and `git diff`.
- Put one file back: `git restore <file>`. A new file that was added: delete it.
- Tell them what was put back.

## Already published
Never erase history. Add a new save that reverses the old one.
1. See the last saves: `git log --oneline -10`. Show them the list in plain words and ask which one to take back.
2. Reverse it: `git revert --no-edit <id>`
3. `npm run build`. It must finish with no errors.
4. `git push`
5. Wait about 2 minutes and check the page on https://remotecoreoutsourcing.com (add `?v=2` to the link).
6. Tell them it is back to how it was.

## If the whole site is down
The fastest fix does not need code: in Vercel, open the project, Deployments, find the last one that worked,
open its menu and choose "Promote to Production" (or "Instant Rollback"). Then undo the change in the code as above,
so the next publish does not bring the problem back. If they are unsure, tell them to contact their developer.

## Never
`git push --force`, `git reset --hard` on published work, or deleting branches on GitHub.
