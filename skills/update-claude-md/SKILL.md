---
description: 'End of session: fold lasting learnings into CLAUDE.md (add, correct, remove).'
---

# Update CLAUDE.md (fold in the session's learnings)

Go through the session and maintain `CLAUDE.md` — the lasting, cross-session truth about
how this project is worked on, its tooling and its pitfalls.

**This skill files things IN. It does not compress.** Every compression rule — distilling,
telegraphing, moving out, consolidating, stale entries, supersession — lives in
`/claude-md-hygiene`. If there is no room, you call that one (step 3) instead of squeezing
here.

## Admission criterion (apply it strictly)

**Only what holds in EVERY future session gets in:**
- Pitfalls we actually walked into — with the concrete symptom, so it is recognisable
- Working patterns and diagnostic techniques that proved reliable
- Hard rules from user decisions (prohibitions, conventions, limits)
- Corrections: an existing entry turned out wrong or outdated → change or delete it,
  **do not write beside it**

**Stays out (lives in the story or `docs/HANDOVER.md`):**
- Task state, open findings, baseline numbers, the names of the current work
- One-off events with no risk of recurrence
- Anything that would be stale in four weeks

**Wording:** symptom → rule, in one sentence. English throughout, no EN/DE mix (translate
learnings you noted in German as you file them). Date of observation only for empirical
facts, and only once per rule.

## Procedure — count once, write once

The old version wrote, measured, was over budget, compressed, wrote on. Measured: 27 tool
calls and a sequence of 11 → 18 → 16 → 13 lines over the limit — it did not converge,
because adding and shrinking ran against each other. Hence:

0. **Precondition: what exists is committed.** While that holds, no wrong call is final —
   it is one `git checkout` away.

1. **Measure before touching anything:**

   ```bash
   node ~/.claude/scripts/claude-md-audit.mjs CLAUDE.md
   ```

   Reports size **in characters** (lines are a readability hint only), the budget verdict
   and the largest sections.

2. **Read `CLAUDE.md` in full** and collect the learnings by the criterion above. File them
   into EXISTING sections; a new section only for a genuinely new subject. Check existing
   entries twice while you are in there: **"is this still true?"** (does something point at
   code this session deleted or renamed?) **and "is this too long?"** — a correct but
   bloated entry is a legitimate compression target. Mark the 2–3 most bloated spots as
   this run's candidates; the audit's section list shows where they are.

3. **Do the arithmetic on paper, BEFORE writing.** Count the characters you are adding and
   the ones you are cutting. **N = additions − deletions − headroom to the SOFT budget**
   (from the audit). Then:

   - **N ≤ 0** → it fits, on to step 4.
   - **N > 0**, or the audit reported `OVER HARD GATE` → **invoke the `claude-md-hygiene`
     skill** (Skill tool, name `claude-md-hygiene`) with the brief "free up N characters,
     do not commit, hand back to me". Only once it returns do you file anything. Do not
     interleave the two — that was the loop that never converged.
   - **Hygiene cannot reach N** (nothing left to compress without losing a rule that still
     holds): **do not break the gate.** File only the learnings with the highest
     error-prevention value, as many as the budget takes, and report the rest as a
     proposal with reasoning. A lost learning is cheaper than a file that is too expensive
     in every session — and that call belongs to the user.

4. **Apply in ONE pass**, through the Edit tool (batched, not through hand-written Python
   or PowerShell replacements — Edit makes the same exact replacement in one call, with no
   re-read and no quoting risk).

5. **Measure once afterwards** (run the script again). Check `referenced docs: N (0
   missing)` while you are there — a dead reference means content that was moved out is
   lost while the core file claims it is filed away. Then commit separately
   (`docs: CLAUDE.md — …`).

6. **Report:** what was added, what changed, what was removed — one sentence of reasoning
   each — plus the before→after balance **in characters**. **Net growth is the exception:**
   the goal is that every session leaves the file the same size or smaller. If it grew, say
   why, here. If you are unsure whether a candidate holds permanently, ask rather than file.

Check at the end: does `CLAUDE.md` still point correctly at the doc and story structure, if
this session changed it?
