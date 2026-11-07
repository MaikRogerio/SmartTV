# Vibe-coding kata — "SmartTV+ Cast: ship it, cast it, keep it honest"

**Format:** Claude Code · 60–90 min · starter repo provided
**Idea:** a free "smart TV" for any TV with a Chromecast: a phone web app (light + dark) with verified live channels from 13 countries
(US, UK, Mexico, Russia, Argentina + Spain, Portugal, Italy, Brazil, Romania, Lithuania, Latvia, Croatia).
**Finance angle:** *a polished screen does not prove the data is right.* The app works like a reporting pipeline: a scheduled job validates
the source data, publishes only what passed, logs the exceptions, and blocks the publish if the result looks wrong (a variance threshold).
The app re-checks the data before showing it, and the Devices tab shows the control evidence.

## Level 1 — Run it (15 min)
- *"Read CLAUDE.md and README.md. Install, run the tests and start the app."*
- Run `npm run check:streams:quick`. **Questions:** which countries have 0 live channels? Top removal reason?

## Level 2 — Change it with plain language (25 min) — pick one
- *"Add a 'Sports only' shortcut on the Explore screen."*
- *"Remember the last country I opened and start there next time."*
- *"Add a high-contrast option to Appearance and check both themes."*

## Level 3 — Control it (25 min)
- *"Add a test proving a channel with a future checkedAt date is rejected"* (then decide if the gate should reject it).
- *"Make the job fail if any of US, GB, MX, RU, AR has 0 live channels, but only warn for the other 8."*
**Check the logic, not the look:** break the gate on purpose and watch the tests fail.

## Done when
- [ ] App runs on a phone in light and dark; one channel plays; casting works on Android + Chromecast
- [ ] 13 countries listed, zero-live ones flagged
- [ ] `npm test` green, including the Rule 1 render test
- [ ] One Level 2 change shipped, with the prompt used noted in one line

## Debrief
1. Where did the AI need a correction from you?
2. Which control here maps to one you own (validation, completeness, exception log, publish approval)?
3. What would you need before using a tool like this in a live process?
