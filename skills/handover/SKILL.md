---
description: 'Rewrites docs/HANDOVER.md — the baton for the next session: where things stand, what is open, what to read first.'
disable-model-invocation: true
---

# Handover

Write this project's session baton to **`docs/HANDOVER.md`** — one fixed path, one
file, replaced every time. Git carries the history. A second dated file is never
the answer: `HANDOVER-2026-07-29-abend.md` sitting beside `HANDOVER-2026-07-29.md`
is the failure mode this command exists to end.

The global `CLAUDE.md` has the next session read this file and check it against
git, so it needs no cover note and no copy-paste.

## LANGUAGE RULE

Talk to the user in the language they write in. The file itself follows the
project's documentation language (English unless that project says otherwise).

## When to write it

**When a step lands — not when the session ends.** A session that runs out of
context cannot write a baton, and autocompact is off on this machine, so "at the
end" in practice means "often never". If the baton's HEAD is already behind the
tree, that is the signal to refresh it, not a normal state.

## What this file is — and is not

A **baton, not a diary**: where are we, what is open, what should the next session
read first. It is read in every session of this project, so its length is a
recurring cost — **target ~80 lines, hard ceiling 120**.

| Does NOT belong here | Belongs in |
|---|---|
| Standing rules, conventions | `CLAUDE.md` |
| Command/tooling tables, environment setup | `CLAUDE.md` |
| Agreed working style | `CLAUDE.md` |
| Architecture, specs, reference | `docs/` |
| The narrative of what got built | git log and the commit messages |
| Inventory numbers a command reproduces | name the command instead |

## Steps

1. **Read the existing `docs/HANDOVER.md`** if there is one. You are updating a
   baton, not writing on a blank page.
2. **Promote before you overwrite.** Anything durable in the old baton — a trap, a
   corrected assumption, a rule that turned out to hold — goes into its target
   document FIRST (`CLAUDE.md`, the project's trap ledger, the relevant doc).
   Overwriting is exactly where knowledge gets lost; this step is the guard. Then
   carry every still-valid dead end forward into the new file.
3. **Measure the current state, never recall it:**
   - branch, `git status --short`, short HEAD sha
   - what is uncommitted — and whether it is this session's work or somebody else's
   - whether HEAD is pushed, and what any deployed environment actually runs
   - the test/gate result. Not run ⇒ that is what you write.
4. **Write the file** from the template below, replacing it completely. Create
   `docs/` if the project has none.
5. **Check the file is tracked.** If `docs/` is gitignored, overwriting destroys
   the previous baton with no history to fall back on — say so rather than losing
   it silently.
6. **Report** in one or two sentences what the baton now says.

## Template

```markdown
# Handover

**Written:** <YYYY-MM-DD HH:MM> · **Branch:** `<branch>` · **HEAD:** `<short-sha>`
**Gate:** <"412 tests green, tsc clean" | "not run"> · **Tree:** <clean | N files, mine/foreign>
**Pushed:** <yes | N commits local only | deployed env runs `<sha>`>

> Run `git log <short-sha>..HEAD --oneline` before using anything below. Any output
> means this is a lead, not the state — check each open item against the tree
> before starting it. Items may already be done.

## Where we are

<2-4 sentences: what was being built, and how far it actually got. Blocking
numbers only — not an inventory.>

## In flight

- [ ] <Open item — what it is, and what "done" looks like>

## Needs your decision

<Only what is blocked on the USER rather than on work. Per item: the question, the
variants, a recommendation, and what each option would mean. Omit if empty.>

## Read first

- `<path>` — <why this one matters for the next step>
- `<path>` — **read yes, believe no**: <which part of it is out of date>

## Do not try again

<Carried forward across sessions. Each entry: what was tried, and the MEASUREMENT
that killed it. An entry stays until it is promoted into a document or made
impossible by the code. This section is the most valuable thing in the file —
never trim it for space; trim the narrative instead.>

## Running right now

<Only if something actually is: a background run, a deploy, a migration.
Otherwise leave the section out.>
```

## Rules

- **Overwrite. Never create a dated sibling file.**
- **Carry gaps verbatim.** Gate not run ⇒ write "not run". Never record a tidier
  state than you actually verified — a baton that overstates is worse than none.
- **Do not restate the project.** The next session already loads `CLAUDE.md`; this
  file adds only what `CLAUDE.md` cannot know — the state of the work right now.
- **Name foreign work as foreign,** so the next session does not sweep somebody
  else's files into a commit.
- **Over the ceiling? Cut before writing.** The oldest entries get promoted into
  `docs/` and linked from here — never silently dropped.
