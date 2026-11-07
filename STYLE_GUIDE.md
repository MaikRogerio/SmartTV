# SmartTV+ Cast style guide

## Themes (CSS variables in src/index.css → tailwind `tv-*`)
| Token | Light | Dark | Use |
|---|---|---|---|
| bg | #f6f8fb | #0a0a1a | page |
| surface | #ffffff | #12122a | header, cards, lists, nav |
| card | #f1f5f9 | #1a1a38 | buttons, inactive pills |
| line | #e2e8f0 | #2a2a50 | borders, dividers |
| fg / muted | #0f172a / #64748b | #f1f5f9 / #9ca3c7 | text |
| accent | #0ea5e9 | #38bdf8 | primary buttons, active chip, cast state |
| soft | #ecf8ff | #122446 | cast card, active card |
| purple | #7c3aed | #a855f7 | logo / play-button gradient end |
| ink | #0f172a | #f1f5f9 | active category pill (inverted) |
Status: live = emerald-500 · zero / warning = amber · stop / error = rose.

## Layout (phone first, 360–430 px; centred max 42rem on larger screens)
Header (sticky) → Search → Cast card → Featured Countries (mono meta label) → Category pills → Continue Watching → Live list.
Mini player above the 5-tab bottom nav while casting. Tab bar: active = accent + dot; Remote shows a green dot when connected; Favorites shows an amber count badge.

## Components
- Radius: cards 16 px (`rounded-2xl`), tiles/buttons 12 px, pills 16 px, round controls full.
- Channel tile: logo on white, or gradient tile with initials ("24 Horas" → 24h).
- Section header: accent icon + bold title + right-aligned mono meta ("13 countries", "7 Recent").
- Type: Plus Jakarta Sans (fallback system UI); meta labels in monospace.
- Touch targets ≥ 44 px; safe-area padding top and bottom.
