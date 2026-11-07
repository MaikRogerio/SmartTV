## SmartTV+ handoff — Option A with the new phone layout + dark mode

### Status
- Static Vite + React PWA, phone-first layout from the user's mockup: header (logo, CAST badge, TV pill, theme toggle), search,
  Direct Chromecast card, Featured Countries chips (All + 13), category pills, Continue Watching cards with "Active",
  live list, mini player while casting, bottom nav (Explore, Categories, TV Remote, Favorites with badge, Devices).
- Light + dark + auto theme (CSS variables, saved per device, no flash on load).
- Unchanged pipeline: lib/* checker, check-streams.ts guards, GitHub Action every 6 h, Rule 1 gate, Rule 2 test.
- `public/data/channels.verified.json` is an empty placeholder → copy the local 276-channel file in, or run the workflow once.

### Verified (build sandbox)
- Strict type check of project code: clean (external packages stubbed).
- 37 Node-side tests passed (parser, checker, catalog, gate, Rule 2, theme, initials).
- Real app bundled and run in headless Chromium at phone size, with a mock Chromecast "Living Room TV":
  casting flow, mini player, remote, devices, categories in light and dark; theme toggle persists after reload.
- Rule 1 in the real browser: bad entries + bad ids planted in favorites/recent never render on any tab or in search;
  device-failed channel hidden and its country flagged; malformed file → error and zero channels.
- NOT run yet: npm install, vitest itself (incl. tests/render.test.tsx), vite build, the Action, a real phone + Chromecast.

### Not done (waiting for the user)
- Nothing pushed. Target repo: MaikRogerio/SmartTV (public; Pages source = GitHub Actions).
