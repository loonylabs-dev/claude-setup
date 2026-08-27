# Contributing

This is one person's `~/.claude`, published for the measurements in it rather than as a
project looking for contributors. That shapes what is useful to send.

## What is genuinely wanted

**"It behaves differently for me."** This is the one thing the repository cannot measure for
itself. Everything in [`docs/measurements.md`](docs/measurements.md) was taken on Windows 11
with Git Bash, on a single Claude Code version, and any of it may be wrong elsewhere or after
an update. If a documented behaviour does not reproduce for you, an issue with your platform,
your Claude Code version and what you saw instead is worth more than a patch.

**A measurement that contradicts one here.** Include the method. A number without the
procedure that produced it cannot be checked, and this repository would rather carry an
uncomfortable finding than a tidy one.

**A defect in the tests or the hook.** They are what keeps the rest honest, so a case they
miss or a false positive they produce is a real bug.

## What is unlikely to be merged

Personal preferences — the skills, the working conventions in `CLAUDE.md`, the language rule.
Fork those; they are not meant to be universal.

## Ground rules if you do send a change

**Everything is English.** Code, comments, documentation, commit messages.
`node tests/language-census.test.mjs` enforces it per file *and* per line — a single
non-English paragraph inside an otherwise English file is exactly the case it was extended to
catch.

**Run the tests.** All four, plain `node`, no dependencies:

```bash
node tests/language-census.test.mjs
node tests/rules-hygiene.test.mjs
node tests/bash-guard.test.mjs
node tests/settings-hygiene.test.mjs     # only meaningful on a machine with the filter registered
```

CI runs the first three. The fourth checks whether the git clean filter is registered in
*this machine's* `.git/config`, which a runner never has — so it stays local. **If you add a
test, decide which kind it is.** A machine-dependent test added to the workflow turns the
pipeline permanently red.

**A claim needs a measurement.** The documentation here distinguishes what was observed from
what was inferred, and marks the difference in the text. "Probably", "should", and "I think"
belong in the prose that says so, not in a statement of fact.

**Never `git add -f`.** The `.gitignore` is an allowlist protecting credentials and session
transcripts. If a file you need is missing, add a `!` rule. The Bash guard refuses the flag
outright.

## Adding things

- **A skill** → `skills/<name>/SKILL.md`.
- **A rule** → `rules/<topic>.md`, **with** a `paths` frontmatter. Without one it loads in
  every session and `tests/rules-hygiene.test.mjs` rejects it.
- **A top-level file** → add a `!` rule to `.gitignore` first, or git will not see it.

The distinction between the three places instructions can live is described in the
[README](README.md#the-three-way-split-of-instructions).
