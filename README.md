# HTML → PWA Wrapper (static starter)

A zero-backend Progressive Web App that lets users paste HTML, save it locally, and **install** the wrapper to open their content on launch.

## How it works
- The PWA ships a fixed manifest and service worker.
- User HTML is stored locally (demo uses `localStorage`; swap to IndexedDB for large docs).
- On launch, the app loads the last saved doc (or a `?doc=<id>` URL). The content renders in an `<iframe srcdoc>` with scripts **disabled by default**.
- Install via the browser's install UI or the custom **Install** button (controlled by `beforeinstallprompt`).

## Deploy
Any static host over HTTPS works (GitHub Pages, Netlify, Cloudflare Pages, Firebase Hosting, Vercel, etc.).

1. Upload these files as-is to your host.
2. Ensure the site is served over HTTPS.
3. Visit the site; the browser should offer installation when criteria are met.

## Security
- Default preview sandbox **does not allow scripts**. Users can opt-in to scripts for trusted HTML.
- The wrapper sets a basic CSP for itself; user HTML runs in the sandboxed iframe context.

## Customize
- Update `manifest.webmanifest` (name, colors, icons).
- Replace icons in `/icons` (192 and 512 PNGs).
- Tweak caching in `sw.js` (it's a simple cache-first app shell).

## Notes
- Installed app name/icon are global to the wrapper. Per-user names/icons require a backend or multi-origin hosting.
- Sharing across devices requires copying a URL with `?doc=<id>` or adding sync storage with a backend.
