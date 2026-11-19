---
name: swap-image
description: Replace or add a photo, picture or logo on the RemoteCore website. Use when someone says "change this photo", "use this picture", "replace the image", "add a picture to", or gives you an image file.
---

# Swap or add an image

## 1. Get the file
- Ask them for the image file path on this computer (they can drag the file into the chat).
- Photos of people: make sure they have the person's permission. Never use a candidate's photo from the platform.

## 2. Make it light
Big photos make the site slow. Turn it into a webp file, at most 1600 pixels wide:

```
npx --yes sharp-cli@5 -i "<their file>" -o public/assets/<short-name>.webp -f webp -q 80 resize 1600
```

- Use a short name in small letters with dashes, like `team-photo.webp`.
- To replace an image, give it a NEW name (not the old one), so browsers do not keep showing the old picture.
- Check the new file is under 300 KB: `ls -la public/assets/`.

## 3. Put it on the page
- Find where the old image is used: `grep -rn "old-name.webp" src/`
- Change the path to `/assets/<short-name>.webp`.
- Update `width` and `height` to the new image size. Read it with:
  `node -e "require('sharp')('public/assets/<name>.webp').metadata().then(m=>console.log(m.width+'x'+m.height))"`
- Write a short `alt` text that says what is in the picture. Use `alt=""` only for pure decoration.
- If no other page uses the old image any more, delete the old file.

## 4. Check
- Run `npm run build`. It must finish with no errors.
- Preview with `npm run start` and look at the page at computer width and phone width (390 pixels).
  The picture must not look stretched or cut off badly.
- Then use the `publish-change` skill.
