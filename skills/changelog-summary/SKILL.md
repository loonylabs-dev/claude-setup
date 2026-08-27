---
description: 'Compact summary of the last 7 days of changes, from a technical and an end-user angle, based on git commits and branches. Optional parameter: number of days (e.g. `/changelog-summary 14`).'
disable-model-invocation: true
---

# Changelog Summary

First check whether a parameter (number of days) was passed, e.g. `/changelog-summary 14`.
- With a parameter: use that value as the period.
- Without: use **7 days** as the default.

State the period you used explicitly in the output.

> **The changelog itself is written for the product's readers, not for this file.** Render
> every heading, bullet and the social post in the conversation language — the headings
> below are given in English because this is an instruction; they are not the literal
> strings to emit. Everything else about language follows `language.md`.

## Step 1: gather the git data

Run these commands (replace `N` with the value you determined):

```bash
# Commits over the last N days (all branches)
git log --all --since="N days ago" --oneline --no-merges --format="%h %s (%an, %ar)"

# Merge commits
git log --all --since="N days ago" --merges --oneline --format="%h %s (%ar)"

# Changed files per commit (for technical depth)
git log --all --since="N days ago" --no-merges --name-only --format="%nCOMMIT: %h %s" | head -200

# Branches active over the last N days
git branch -a --sort=-committerdate | head -20
```

## Step 2: write the summary

Analyse the data and produce the following output:

---

### Output format

```
## Changes over the last N days ({{DATE_FROM}} – {{DATE_TO}})

---

### ✨ What's new for you

Features and improvements the user can feel, written to excite.
Phrasing: "you can now…", "from today…", "new:".
Only what the user can directly see, touch or experience.
Max. 5-7 points. No technical terms. No jargon.

Shape:
- **[feature name]:** you can now…
- **[feature name]:** from today…

---

### 🔧 Improved under the hood

Performance, stability and technical quality work the user does not see directly but
does notice (faster, more reliable, fewer crashes).
Only things without a visible failure story — no "X was broken".
Phrasing: short and factual, no filenames or API names.
Max. 4-6 points.

Shape:
- **[area]:** what was stabilised or optimised.
- ...

---

### 🐛 Bugfixes

Visible defects that were fixed — wrong behaviour, broken UI, crashes, wrong output.
Only bugs a user would concretely have noticed. No internal refactoring.
Phrasing: what was broken → now fixed. Short, no jargon.
Max. 5-8 points.

Shape:
- **[feature/area]:** [what the problem was] — fixed.
- ...

---

### 🔩 Technical (for developers)

Compact summary grouped by subject area (max. 8-10 points).
Each point: 1-2 sentences, naming the file or module, one concrete technical statement.
No filler. Facts only.

Shape:
- **[area]:** what changed, and why if the commit says.
- **[area]:** ...

---

### 📱 Social post of the week

Pick the **strongest user-facing features** from "✨ What's new for you" — the ones that
excite or surprise most.

**How many bullets:** decide by the quality of the week:
- **5 bullets** when there are many strong, tangible features
- **4 bullets** as a good middle for a solid release
- **3 bullets** when little is user-visible — fewer beats padding

Write a **short social post** that:
- opens with a strong hook (curiosity, surprise, FOMO)
- names the chosen features as short bullets (max. 1 line each, led by an emoji)
- closes with a clear call to action

Tone: direct, energetic, a founder sharing progress — not an advertisement.
Address the reader informally.

**Audience and call to action come from the project, not from this skill.** Take them from
`CLAUDE.md` / `README.md` (product description, USP, domain). If there is nothing usable
there, ask ONCE — do not invent an audience.

Shape (4 bullets):
```
[hook — 1 line]

✨ [feature 1 — 1 line]
🎙️ [feature 2 — 1 line]
📱 [feature 3 — 1 line]
🚀 [feature 4 — 1 line]

[call to action — product name/domain from the project]
```

---

### 📊 Activity

- Commits: X (excluding merges)
- Active branches: X
- Most-changed areas: [top 3 directories/modules]
```

## Guidelines

- **"✨ What's new"** — genuine user features only: new functions, new content, visible UX
  improvements. No "bugfix under the hood".
- **"🔧 Under the hood"** — bugfixes, performance, stability the user feels indirectly
  (faster, fewer errors, more reliable). No filenames.
- **"🔩 Technical"** — the full technical picture with module references, for developers.
- **Group by subject**, not chronologically (e.g. storage, TTS, export, UI, bugfixes).
- **Merge commits** only when they close a feature branch (useful context).
- Commit messages with `fix:` → "under the hood"; `feat:` → "what's new";
  `refactor:`/`chore:` → technical only.
- **Social post:** pick the features with the highest wow factor — visible, tangible,
  surprising. No jargon, no filenames, no architecture topics.
