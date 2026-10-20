# Agent Instructions

- Start every response with the wizard emoji "🧙" when working in this repo.
- Use pnpm.
- Work directly on `main` unless the user explicitly asks for a branch.
- Keep `me.json` public, portable, and independent of any one ME3 deployment or provider.
- Never add secrets, private agent data, account state, or installation configuration to the public protocol.
- Follow `/Users/kieranbutler/Coding/docs/testing.md` for new tests.

## Responses

- The owner runs many sessions in parallel. Keep replies short: what changed, the current state, and the next action.
- Only mention something the owner must act on or would be harmed by not knowing. Leave out background, side observations and nice-to-knows; file real follow-ups as beads instead of describing them.

## Ecosystem Source Of Truth

- Canonical high-level ecosystem docs live at `/Users/kieranbutler/Coding/docs`.
- Read `/Users/kieranbutler/Coding/docs/README.md` and `/Users/kieranbutler/Coding/docs/projects/me3-protocol.md` before strategic or cross-app work.
- Durable architecture and product boundaries belong in these docs. Actionable plans and execution history belong in the owning repository's issue tracker or beads database.
- The current product and repository map lives in `/Users/kieranbutler/Coding/docs/README.md`; do not infer it from historical folders or duplicate the list here.

## Verification

- Run `pnpm test` after protocol or schema changes.
- Run a focused Markdown review for docs-only changes.
- Verify git scope before staging and never force-push `main`.
