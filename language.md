# Language

Two axes, set independently. This file is the only place either one is named —
imported by `CLAUDE.md`, expanded into context at session start.

## What Claude says to you

Follows `language` in `settings.json` — currently `german`. That setting also drives
voice dictation. To switch, change it there; no skill, command or rule has to move
with it.

## What Claude writes

**Artefacts are English** — code, identifiers, comments, docs, `CLAUDE.md`, commit
messages. There is no setting for this, and it is deliberately *not* tied to the
conversation language: artefacts have to stay readable for whoever picks this setup
up, whatever language they talk in.

A repo whose own `CLAUDE.md` pins otherwise wins, including a border drawn per file
type or layer (deep-research-toolkit: docs German, `.ts` English, guarded by a test).

**One language per repo, and never mix on the way there.** A repo with German history
stays German until it is migrated in one go — writing the other language into standing
history is the failure this rule exists for, in both directions.

## While the conversation language is German

The rules below are German-specific. Switching the conversation language means
replacing this section, not translating it — none of it is general typography advice.

- Correct umlauts and ß, never ASCII substitutes, whatever language the repo is
  written in.
- German quotes are „…“ (U+201E … U+201C). A closing ASCII `"` inside a `"…"` string
  literal or a JSON value ends the string — `TS1005 ',' expected` and "could not be
  parsed as JSON" are that, not a syntax slip.
