---
description: 'Hygiene and compression pass over CLAUDE.md (distil, strip filler, drop stale, archive per topic) — WITHOUT new learnings. Owns every compression rule.'
---

# CLAUDE.md Hygiene (audit & compression)

Condense and clean up `CLAUDE.md` without adding new findings.

**Boundary:** `/update-claude-md` files session learnings IN; this skill only touches what
is already there. **The compression rules live here and nowhere else** — the other skill
calls this one instead of repeating them.

**Supreme law (not negotiable): NO rule that still holds may be lost.** A generic law
(symptom → rule) that will prevent a mistake next time ALWAYS stays — in the core,
distilled. What gets moved out or deleted is the EVIDENCE (derivation, measurements,
calibration constants, anecdotes, superseded models). If you find an actionable rule while
moving evidence out and it is missing from the core: distil it into the core FIRST, then
move the rest.

**What may move out is CONTENT — never the rule.** The line does not run between
"important" and "unimportant", but between the law and its evidence:

| | May leave the core? |
|---|---|
| **The rule itself** — symptom → law, in one sentence | **NEVER.** Not moved out, not deleted. It may only be worded more briefly. |
| **Its evidence** — measurements, derivation, rejected alternatives, how the failure surfaced | Moves into a topic file; the back-reference stays in the section |
| **Pure lookup knowledge with no law** — port tables, test users, recipes, command sequences | May move entirely, a reference stays |
| **A rule that no longer HOLDS** — points at deleted code, superseded by a new model | Is withdrawn, with the reason spelled out in the report. That is not loss, that is cleanup. |

**There is no fifth case.** If nothing in this table covers something, it stays. And the
test for the last row is strict: "no longer holds" means the code it describes is gone or
a new model replaced it — not that it is long, inconvenient or rarely needed.

Evidence from practice (one project, 48,768 → 30,021 characters): three lore files were
opened, and all three imperative sentences appearing in them still stand in the core too.
That is exactly the shape to aim for — lore explains the why, it does not replace the law.

**A precondition, not a suggestion: what exists is committed BEFORE the pass starts.**
That is the actual safety net — while it holds, no wrong call is final, it is one
`git checkout` away.

## Measured in CHARACTERS, not lines

A line budget invites denser lines and then reports "no growth" while the file grows.
Measured on one project: three commits in a row at exactly 399 lines (one under the 400-line
gate), characters going 27099 → 27625, and density drifting from 62 to 69 characters per
line within a week. Lines stay a readability hint, but are **never the gate**.

Projects declare their budget in KB, e.g. `Budget ~23 KB (hard gate 25 KB)` — the audit
script reads that from the file.

## When to run it

- The audit reports an overrun (`VERDICT: OVER HARD GATE`).
- **Called from `/update-claude-md`**, because new learnings do not fit the budget.
- A language mix has crept in, a wave of deletions left sections stale, the same law is
  stacking up ("third instance of the class").
- On request.

## Procedure

1. **Measure — one call, not five:**

   ```bash
   node ~/.claude/scripts/claude-md-audit.mjs CLAUDE.md
   ```

   Gives size in characters and estimated tokens, the budget verdict, the largest sections
   (by subtree — cut there first), filler-word candidates, date ballast and language mix.
   Exit code: 0 within budget, 3 over soft, 1 over the hard gate. Note the starting number;
   make sure what exists is committed (a clean diff to compare against at the end).

   **Two targets the script does NOT find — grep for those:**
   - **Stale:** grep the class, file and API names the entries mention — do they still
     exist? A law pointing at deleted code is worse than no entry.
   - **Duplicates:** search for the same predicates and API names — are several paragraphs
     stacking up on one class of rule ("third instance")?

2. **Set the target before you write.** How many characters have to go? When called from
   `/update-claude-md`: their number plus a buffer. Collect the cuts from what is there and
   **do the arithmetic before touching the file** — not write, measure, patch up. That
   convergence loop was the most expensive part of the old version (measured: 27 tool
   calls, a sequence of 11 → 18 → 16 → 13 lines over the limit — it got worse in between).

3. **Transform** — the core rules:

   - **Distil:** evidence out, rule + why in ONE sentence. Derivation and numbers → a small
     topic file in the project's docs or archive directory, with a one-line back-reference
     from the section.
   - **No monster archive:** ONE file per topic; if the project already has a filing
     scheme, use it. Not a new file per individual finding.
   - **Telegraphic style — and the default is CUT, not keep.** A CLAUDE.md is a rule sheet
     read by a model, not prose read by a person. It is allowed to sound clipped. The test
     for every word is only: *does the meaning stay unambiguous without it?*

     **Cut by default:**

     | Class | Before | After |
     |---|---|---|
     | Article before a noun the context fixes | Killing **a** process needs `taskkill /T /F` | Killing process needs `taskkill /T /F` |
     | Article inside a description | reaches only **the** direct process | reaches only direct process |
     | Article before a compound | sends **a** window-close message they ignore | sends window-close message they ignore |
     | "here" / "on this machine" under a heading that already says so | A missing command exits 1 **here** | A missing command exits 1 |
     | Copula in an enumeration | severity **is** honest, impact **is** concrete | severity honest, impact concrete |
     | Softeners | that **actually** ships · **simply** run | that ships · run |

     **Keep — these three carry meaning, not politeness:**

     | Class | Why |
     |---|---|
     | `which`/`that` introducing a *reason* | "throw on `res.error`, **which** otherwise returns empty" — without it the clause reads as a new main statement instead of a cause |
     | An article that marks *which* one | "**the** test that failed" ≠ "a test that failed" where the difference decides the action |
     | Negations, quantities, exact identifiers | never compress `NOT`, `only`, `≥`, a threshold, a filename |

     Read the result once. If it is ambiguous, put the one word back that resolves it — not
     the sentence. The script only shows candidates; the decision is made here, word by word.
   - **One language.** No mixing, not even inside a sentence. The language is whatever
     `language.md` and the project's own `CLAUDE.md` settle on — when you touch an old
     passage in the other language, convert it as you go rather than leaving a seam.
   - **Consolidate instead of stacking:** a new instance of an existing rule → sharpen the
     entry that is there, do not put a paragraph beside it.
   - **Stale goes out entirely:** a law that only explains HISTORY (code is stable, it warns
     of no future mistake) leaves the core → one-line reference. Rule of thumb: "would a new
     agent make the same mistake WITHOUT this paragraph?" No ⇒ out.
   - **Supersession, cleanly:** never carry the old and the new model side by side; REMOVE
     `(SUPERSEDED …)` inline markers during the pass rather than preserving them.
   - **An active campaign stays in the core:** only DONE/SUPERSEDED moves to the archive.
     Ongoing detail lives in its story, distilled in the core.

   **Apply through the Edit tool**, batched — not through hand-written PowerShell or Python
   replacements. Edit makes the same exact string replacement in one call, with no re-read
   and no quoting risk.

4. **Verify — prove nothing was lost:**
   - Run the audit script again: target reached? And **`referenced docs: N (0 missing)`** —
     a dead reference means content that moved out is gone while the core claims it is filed.
   - **From ~15 % shrinkage the loss check is mandatory, not optional:** 1–3 reviewers in
     parallel (`Agent`, `model: opus`, read-only) with the concrete question — *for every
     imperative sentence that disappeared from the diff: where did it go?* Acceptable
     answers: the rule still stands in the core (just shorter — where?), or only its
     evidence moved (where to?), or it no longer holds (why?). **A sentence carrying a rule
     that still holds and is no longer in the core is a loss and gets pulled back** — even
     if it turns up in a lore file. Additionally: flag leftover filler and over-compression.
   - Open a sample of reference targets: do they actually cover what the reference promises?
   - `git diff --stat` — ONLY the edited lines should churn (whole-file churn = an encoding
     or line-ending accident).

5. **Report.** Every cut with its row from the table above AND its destination: evidence
   moved out (→ which file), lookup knowledge relocated (→ which file), rule withdrawn
   (+ why it no longer holds). **A rule that still holds does not appear in this list** — if
   one does, the pass failed. Plus the before→after balance **in characters**.

   - **Standalone run:** commit separately (`docs: CLAUDE.md — …`).
   - **Called from `/update-claude-md`: do NOT commit.** Report how many characters you
     freed (and if the target was unreachable: how many are missing and why cutting further
     would cost a rule that still holds), then hand back to the caller. They file and commit
     in one go.

## Traps (learned the hard way)

- **NEVER put an existing UTF-8 project file through PowerShell text pipelines** (mojibake +
  BOM + whole-file churn). Text edits go through the Edit tool.
- **Do NOT use `@path` imports** to move detail out — they load EAGERLY into the startup
  context and undo the whole point. Prose back-references are what this is for.
- **Deliberately "broken" examples stay broken.** If a symptom appears verbatim as a
  demonstration in the file (a mojibake line inside an encoding rule, say), that is the
  content, not an accident — do not "fix" it.
- This skill stays lean itself (the meta-irony of a bloated anti-bloat skill).
