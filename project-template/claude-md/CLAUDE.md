# CLAUDE.md — blueprint

Copy to `<project>/CLAUDE.md`, fill in, delete what does not apply. Delete this
header block too.

**Before writing a single line, know what this file costs.** It is loaded in full
into *every* session of this project, on top of the global `~/.claude/CLAUDE.md`.
Every line has to earn its place.

**The test for an entry:** would Claude make a mistake without it? If no, it does
not belong here. Documentation belongs in `docs/`, tutorials belong nowhere.

**What the global setup already covers — do NOT restate it here:** the honesty and
confidence rules, test-speed vigilance and red→green, how much explanation the user
wants, and this machine's git/PowerShell quirks. Language is covered twice over and
belongs here even less: what Claude *says* comes from `language` in
`~/.claude/settings.json`, what Claude *writes* from `~/.claude/language.md`.
Write a line here only where this project OVERRIDES a global rule, never to repeat
one — a duplicate costs tokens in every session and drifts out of sync silently.

**Form:** an entry is the generic law — failure mode → rule, in one sentence. Not
the story of how it was found. Tables beat prose wherever a table fits.

**Budget:** state it in KB, e.g. `Budget ~30 KB (hard gate 35 KB)` — the audit script
reads that line. Measure with `node ~/.claude/scripts/claude-md-audit.mjs`. Size counts
in **characters, not lines**: a line budget invites denser lines and reports "no growth"
while the file grows.

---

# CLAUDE.md

<One sentence: what this project is. Then a pointer to where the deep reference
lives, e.g. `SPEC.md` (architecture), `DESIGN.md` (visual identity).>

---

## CRITICAL PRIORITIES

<The 3-8 rules that are non-negotiable *in this project* — a domain invariant, a
data rule that must never be violated, a UX maxim the product is built on. Not
general good practice: that lives in the global `~/.claude/CLAUDE.md` and already
applies here.>

1. **<Rule>** — <why, in half a sentence>

---

## PROJECT AT A GLANCE

| Layer | Technology |
|-------|-----------|
| Framework | <> |
| UI | <> |
| Database/Auth | <> |
| Testing | <> |

<Delete rows that do not apply. Add none that Claude could infer from
package.json in two seconds.>

---

## KEY ARCHITECTURE

```
<src/ layout — only the directories whose PURPOSE is not obvious from the name>
```

**<Layering law, if the project has one>** — e.g. "components → feature lib →
domain; domain never imports queries". State it as a law, not a suggestion; this
is the kind of rule that gets violated silently.

---

## TRAPS

> **The highest-value section in this file.** Everything here is something that
> already went wrong once. A trap costs one line and saves an hour.

- **<Symptom>** → <cause and rule>. <Optional: the one file where it lives.>

<Examples of what belongs here: a framework convention that differs from what a
model would assume; a silent cap or truncation; a config that must be changed in
two places; an ordering requirement between deploy steps; a destructive command
that must never run unprompted.>

---

## TESTING

| Situation | Command |
|-----------|---------|
| After code changes (default) | <> |
| Before commit | <> |
| Before merge / release | <> |

<If a lane is slow, say how slow — a measured number prevents both needless
waiting and needless skipping. If a command is destructive, mark it here.>

---

## ENVIRONMENT

<Only what is needed to run the project and is NOT already in `.env.example` or
the README. Ports, local service names, the one credential that works
differently. If it is written down elsewhere, link instead of copying — a copy
goes stale silently.>

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| <> | <> |

---

## COMMIT RULES

- <Gate that must be green before committing>
- <Commit message convention, if the project has one>

---

## PROJECT OVERRIDES

> Explanation depth, honesty and confidence rules, test discipline and this
> machine's environment quirks are set globally in `~/.claude/CLAUDE.md`; the two
> language axes in `~/.claude/language.md` and `settings.json`. All of that already
> applies here. This section is ONLY for where this project deviates from one of them.

- **<What differs here>** — <e.g. "docs in this repo are German, code and comments
  English" — `language.md` says a repo's own CLAUDE.md wins, including a border
  drawn per file type; state which side each one falls on>

<Delete this section entirely if the project has no overrides — that is the
normal case.>
