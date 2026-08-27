---
description: 'Efficiently analyze and fix problems with targeted search, single-point proposal, and quality-gated implementation (80/20 approach).'
---

# Efficient Analyze & Fix Workflow (80/20)

**Goal:** Rapid diagnosis and fix with minimal token usage. Prioritize targeted search over broad exploration and single best-practice solutions over multiple variants.

**Scope:** This skill is the right one when the fault site and the symptom are both clear. If the cause is unknown, several suspects are in play, or a regression is suspected, take `/analyze-fix` instead — there you buy exploration and solution variants with tokens.

---

## LANGUAGE RULE

**Always respond in the same language the user used in their request.**
If the user writes in German, respond in German. If in English, respond in English. This applies to all outputs, reports, and conversation.

---

**Trigger:** User describes a problem, error, or bug.

---

# PHASE 0: BRANCH CHECK

## 0.1 Verify Branch

**Before anything else, check the current git branch.**

```bash
git branch --show-current
```

- If on `master` or `main`: **Create a branch automatically**
- Branch naming: `fix/{{problem-slug}}` (lowercase, kebab-case)

**Action:** Automatically create the branch without asking:
```bash
git checkout -b fix/{{problem-slug}}
```

Then inform the user:
```
"Branch created: fix/{{problem-slug}}"
```

**QUALITY GATE:** Do not proceed on master/main until branch is created.

---

# PHASE 1: TARGETED DIAGNOSIS (Sniper Approach)

## 1.1 Targeted Search

**Do NOT launch broad exploration agents.** Use low-token tools first:

1.  **Keyword Search:** `grep -r "error_message_or_symbol" .` to pinpoint location.
2.  **Read Context:** Read *only* the specific file(s) identified by search.
3.  **Trace:** Only follow imports/calls if strictly necessary to understand the bug.

## 1.2 Conditional History Check

**Only** run git log/diff if the user implies a regression (e.g., "stopped working", "was fine yesterday").
Otherwise, skip this step to save tokens.

## 1.3 Root Cause Definition

Define the problem concisely:
- **Location:** File + Line.
- **Why:** The mechanism causing the error.

---

# PHASE 2: UNIFIED PROPOSAL GATE

## 2.1 Present Diagnosis & Solution

Combine analysis and solution proposal to save a turn. **Propose the SINGLE best solution immediately.**

Only generate alternatives (Variante A/B/C) if the solution is high-risk or involves a major architectural trade-off.

**Output Template:**

```
**DIAGNOSE**
[Concise Root Cause - 1-2 sentences]
**Affected File:** `path/to/file`

**PROPOSAL (Best Practice)**
[Description of the fix]

**Plan:**
1. [Implementation step]
2. [Verification step]

---
Wait for your GO to continue. (Or ask for "alternatives" if unsure)
```

**QUALITY GATE:** Wait for explicit user confirmation ("GO", "weiter", etc.).

---

# PHASE 3: IMPLEMENTATION

## 3.1 Execute Solution

Implement the fix autonomously:
- **Style:** Mimic surrounding code style exactly.
- **Scope:** Edit *only* what is necessary.
- **No Chatter:** Perform file edits without asking for intermediate feedback.

## 3.2 Targeted Verification

Avoid running the full test suite if possible (saves output tokens).

1.  **Run specific test:** `npm test -- <relevant-test-file>`
2.  **If no test exists:** Create a minimal reproduction test case *only* if manual verification is complex/unreliable.
3.  **Fix & Retry:** If tests fail, fix them and retry until green.

---

# PHASE 4: COMPLETION

## 4.1 Brief Report

Keep the final report ultra-short.

```
**FIX COMPLETE**

**Summary:** [One sentence on what was fixed]
**File:** `path/to/file`
**Verification:** [Test passed / Manual check]

**Ready for Review.**
```

---

# QUICK REFERENCE

```
PHASE 0: BRANCH CHECK
└── Auto-create branch if on master

PHASE 1: TARGETED DIAGNOSIS
├── Grep/Search (No broad exploration agents)
└── Define Root Cause

PHASE 2: PROPOSAL GATE
├── Propose Single Best Solution
└── [GATE] Wait for user GO

PHASE 3: IMPLEMENTATION
├── Execute Fix
└── Run Targeted Tests (npm test -- <file>)

PHASE 4: COMPLETION
└── Brief Summary
```

---

# COST EFFICIENCY GUIDELINES

**1. "Sniper" vs "Shotgun":**
- Avoid `Explore agent` or generic `ls -R`.
- Assume you can find the file with `grep` or by guessing the path based on conventions.

**2. One Solution:**
- In 80% of cases, the "Standard Way" is the right way.
- Do not waste tokens generating "Variante B" and "Variante C" unless the "Standard Way" is blocked.

**3. Lazy Reading:**
- Do not read file contents until you have confirmed the file path is relevant.

**4. Lean Output:**
- Keep your responses to the user concise. Long explanations consume output tokens.