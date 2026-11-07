# CLAUDE.md — SmartTV+ Cast project context for Claude Code

## What this is
Vite + React 18 + TypeScript + Tailwind static PWA, deployed to GitHub Pages (repo MaikRogerio/SmartTV, base path /SmartTV/).
Phone-first layout (header with cast pill + theme toggle, search, cast card, country chips, category pills, Continue Watching,
list, mini player, 5-tab bottom nav). Light + dark mode via CSS variables.
Data = `public/data/channels.verified.json`, produced by `scripts/check-streams.ts` in a scheduled GitHub Action.
Playback: hls.js on the phone (native HLS on iPhone). Casting: Google Cast Web Sender + Default Media Receiver.

**Rule 1:** never render a channel that has not passed the health check. All UI data flows through `gateCatalog()` then `visibleChannels()`.
**Rule 2:** `FEATURED_COUNTRIES` (13) always includes US, GB, MX, RU, AR. Zero-live countries are flagged (UI + job log + job summary).

## Theme system
- Tokens are RGB triplets in `src/index.css` (`:root` = light, `.dark` = dark): bg, surface, card, line, fg, muted, accent, accent-fg, soft, purple, ink, ink-fg.
- `tailwind.config.ts` maps them to `tv-*` colours with alpha support (`bg-tv-surface/90`). `darkMode: 'class'`.
- Use `tv-*` classes for anything themed. Use `dark:` only for fixed palette colours (amber/rose/emerald states).
- `lib/theme.ts` + `hooks/useTheme.ts` (Light / Dark / Auto, saved in localStorage). `index.html` applies it before first paint.
- The video player is always dark (fixed colours).

## Map
```
index.html                 theme pre-paint script, Cast SDK loader + __onGCastApiAvailable, manifest link
src/App.tsx                tabs, play/cast orchestration, queue, toast, mini player
components/                AppHeader, CastPill, ThemeToggle, SearchBar, CastStatusCard, SectionHeader, CountryChips, CategoryPills,
                           ContinueWatching, ChannelList, ChannelLogo, MiniPlayer, BottomNav, VideoPlayer
components/tabs/           ExploreTab, CategoriesTab, RemoteTab, FavoritesTab, DevicesTab
hooks/                     useCatalog (fetch + gate), useLibrary (localStorage), useCast, useTheme
lib/  (framework-agnostic, relative imports only)
  m3u.ts · streamChecker.ts · catalog.ts (Node only) · verified.ts (Rule 1 gate) · coverage.ts · featured-countries.ts (Rule 2)
  storage.ts · cast.ts · theme.ts · countries.ts · utils.ts (cn, timeAgo, initials, tileGradient)
scripts/check-streams.ts   CLI: per-country table, removal reasons, GitHub summary/annotations, publish guards
public/                    manifest, sw.js (app shell only, never streams), icons/, data/channels.verified.json
tests/                     vitest: m3u, streamChecker, catalog, verified, featured, theme, render.test.tsx (jsdom, all 5 tabs)
docs/screenshots/          light/dark previews
```

## Commands
`npm install` · `npm test` · `npm run typecheck` · `npm run dev` · `npm run build` · `npm run check:streams:quick`

## Conventions
- New data source → must go through `checkStream` in the job AND `gateCatalog` in the app.
- Every element that shows a channel carries `data-channel-id` (the Rule 1 render test relies on it).
- Never add a fallback/demo channel list to the app (would break Rule 1).
- Design at 360–430 px first; touch targets ≥ 44 px; safe-area padding. Check both themes for every change.
- Do not push, create repos or change GitHub settings without the user's confirmation.

## Backlog
1. First deploy + one manual workflow run; verify on an Android phone with a Chromecast.
2. Track Chromecast load failures and hide channels that fail on the TV.
3. EPG "now / next" from iptv-org guides on Continue Watching cards and the remote.
4. Self-host the Plus Jakarta Sans font (design font) instead of the system font.
