# ONLY US
Static site (HTML/CSS/vanilla JS). Everything you edit is in `config.js`.

## 1. Connect Google Drive (required once)
The folder ID is already set. The site must be able to *list* the folder and *load* its images.

1. **Folder sharing:** in Drive, share the folder as **Anyone with the link → Viewer**. Drive thumbnails only load for link-shared files. Anyone who finds your site can therefore see these photos; an unlisted URL is not private.
2. **Listing — pick ONE:**
   - **A) API key (simplest):** Google Cloud Console → new project → enable *Google Drive API* → Credentials → *API key*. Restrict it to **HTTP referrers** (your site URL, e.g. `https://USER.github.io/*`) and to **Drive API** only. Paste into `driveApiKey`. The key is visible in page source, which is why the restrictions matter; it is read-only and can only see link-shared files.
   - **B) Apps Script (no key):** script.google.com → New project → paste `apps-script/Code.gs` → Deploy → New deployment → Web app → Execute as **Me**, access **Anyone** → authorize → copy the `/exec` URL into `appsScriptUrl`. Re-deploy a new version if you edit the script.
3. New uploads appear on an open page after `syncSeconds`, and on the next visit. No code changes or redeploys.

Limits: images still require link-sharing (step 1), and Drive may throttle thumbnails if there are very many photos.

## 2. Music
`assets/our-song.mp3` (any file; change `music` in config). Plays only after tapping the disc button. Only publish music you have rights to; a public site makes it public. Large files: GitHub Pages rejects files over 100 MB, so trim/compress long tracks.

## 3. Customise
Story text, credits, captions (`captions: {'IMG_1.jpg':'text'}`), her name, start date, sort order: `config.js`.

## 4. Deploy (GitHub Pages)
Push these files to a repo → Settings → Pages → deploy from `main` / root. Or open `index.html` through any static server (`python3 -m http.server`); Drive calls need http(s), not `file://`.

## 5. Timer method
Both instants are converted to wall-clock fields in `Asia/Kolkata`, subtracted field by field with borrows; the day borrow uses the actual length of the previous calendar month. Recomputed from the clock every second and on tab return.

## 6. Troubleshooting
- "Setup needed" banner: step 2 not done.
- Placeholder hearts only: check sharing (step 1) and key restrictions/referrer.
- HTTP 403 from API: Drive API not enabled, or referrer doesn't match.
- No sound: file missing, or tap the disc button (browsers block autoplay).

## 7. Testing checklist (not yet run — tick each yourself)
- [ ] Photos load from the folder; upload one more → appears after sync and on reload
- [ ] Delete a photo → disappears
- [ ] Vinyl turns slowly; scroll up/down moves the orbit both ways
- [ ] Hold vinyl/photo pauses, release resumes without a jump; tap opens viewer; scrolling doesn't pause
- [ ] Viewer: Esc, arrows, swipe, close restores scroll/focus
- [ ] Music button with and without the mp3
- [ ] Timer reads from 15 Jul 2024 15:30 IST; correct after tab switch
- [ ] 320/360/375/390/430 px widths: no horizontal scroll, timer doesn't overlap controls
- [ ] Reduced-motion on; credits appear in order
