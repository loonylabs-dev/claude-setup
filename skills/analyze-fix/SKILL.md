---
description: 'Analyze and fix a problem with deep exploration, confidence check, solution variants, and autonomous implementation.'
disable-model-invocation: true
---

# Analyze & Fix Workflow

**Goal:** Deep problem analysis with exploration agents, user confirmation at confidence gate, solution variants, and autonomous implementation with tests and documentation.

---

## LANGUAGE RULE

**Always respond in the same language the user used in their request.**
If the user writes in German, respond in German. If in English, respond in English. This applies to all outputs, reports, and conversation.

---

**Trigger:** User describes a problem, error, or bug to analyze and fix.

**Scope:** Take `/analyze-fix-cheap` when the fault site and the symptom are clear and the work is essentially the fix itself. This skill earns its cost when the cause is unknown, several suspects are in play, or a regression is suspected — it buys exploration and solution variants with tokens.

---

# PHASE 0: BRANCH CHECK

## 0.1 Verify Branch

**Before anything else, check the current git branch.**

```bash
git branch --show-current
```

- If on `master` or `main`: **Create a branch automatically**
- Branch naming: `fix/{{problem-slug}}` - derive slug from problem description (lowercase, kebab-case, max 40 chars)

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

# PHASE 1: CLARIFICATION (if needed)

## 1.1 Check Problem Description

Review the user's problem description for clarity:

| Check | Question if unclear |
|-------|---------------------|
| Error location unclear | "Where exactly does the error occur?" |
| Expected behavior missing | "What should happen instead?" |
| Reproduction unclear | "How can I reproduce it?" |
| Multiple issues mixed | "Let's tackle the problems one at a time. Which one first?" |

**If description is clear:** Proceed directly to Phase 2.
**If unclear:** Ask all clarifying questions NOW, not later.

---

# PHASE 2: DEEP EXPLORATION & ANALYSIS

## 2.1 Launch Exploration Agents

Use Task tool with specialized agents for thorough analysis:

```
Parallel agent tasks:
1. Explore agent: Find all files related to the problem area
2. Explore agent: Trace the code path / data flow
3. Explore agent: Find similar patterns in codebase
```

**For regressions, also:**
- Check recent git commits: `git log --oneline -20`
- Check recent diffs: `git diff HEAD~5..HEAD -- <relevant-paths>`
- Check recent branches that were merged

## 2.2 Root Cause Analysis

Document findings:
- **Affected files** (with line numbers)
- **Code flow** causing the issue
- **Root cause** (the actual "why")
- **Regression check** (was this working before? what changed?)

## 2.3 Self-Reflection

Before presenting to user, reflect:
- Do I fully understand the problem?
- Are there edge cases I might miss?
- Is my analysis complete or are there gaps?
- What is my confidence level and why?

---

# PHASE 3: CONFIDENCE GATE

## 3.1 Present Understanding

Present a **structured summary** (max 10 sentences):

```
**PROBLEM ANALYSIS**

**CURRENT (Current):** [What is happening]
**SHOULD BE (Expected):** [What should happen]
**Root Cause:** [Why it happens]
**Affected Files:** [List with paths]
**Regression:** [Yes/No - if yes, what commit/change caused it]

**Confidence: XX%**
[Brief explanation why this confidence level]

---
Wait for your GO to continue.
```

**QUALITY GATE:** Wait for explicit user confirmation ("GO", "weiter", "ja", etc.)
Do NOT proceed without clear signal from user.

---

# PHASE 4: SOLUTION VARIANTS

## 4.1 Generate Three Solutions

Present exactly **3 solution variants** with Pro/Contra:

```
**SOLUTION VARIANTS**

### Variant A: [Name]
[Description of approach]
| Pro | Contra |
|-----|--------|
| ... | ...    |

### Variant B: [Name]
[Description of approach]
| Pro | Contra |
|-----|--------|
| ... | ...    |

### Variant C: [Name]
[Description of approach]
| Pro | Contra |
|-----|--------|
| ... | ...    |
```

## 4.2 Recommend Best Solution

```
**RECOMMENDATION: Variant [X]**

Reason:
- [Why this is the best fit for the codebase]
- [Long-term maintainability consideration]
- [Pattern consistency with existing code]

Effort: [Simple/Medium/Complex]
```

**Evaluation criteria:**
- Fits existing codebase patterns
- Long-term maintainability
- No over-engineering, but no shortcuts either
- If a more complex solution is clearly better, prefer it

## 4.3 Confirm Selection

```
"I recommend Variant [X]. Should I proceed with this solution?"
```

If user disagrees or wants changes, adjust before proceeding.

---

# PHASE 5: IMPLEMENTATION

## 5.1 Execute Solution

Implement the selected solution autonomously:
- Make all necessary code changes
- Follow existing code patterns and conventions
- Use agents for complex implementations if needed
- **No questions during implementation** - all clarifications should be done

## 5.2 Adapt/Create Tests

Check existing tests:
```bash
# Find related tests
find tests -name "*.test.ts" | xargs grep -l "<relevant-terms>"
```

**Actions:**
- [ ] Update existing tests if behavior changed
- [ ] Add new tests for the fix
- [ ] Ensure edge cases are covered

## 5.3 Run Tests

```bash
npm test
```

**If tests fail:**
- Fix the failing tests
- Re-run until all pass
- Do NOT skip this step

## 5.4 Check Documentation

Review if any docs need updates:

| Doc Location | Update if... |
|--------------|--------------|
| `CLAUDE.md` | Core patterns changed |
| `docs/` | API or architecture changed |
| Inline comments | Complex logic added |

**Only update docs that are directly affected.**

---

# PHASE 6: COMPLETION REPORT

## 6.1 Generate Report

```
**FIX COMPLETE**

**Problem:** [One-line summary]
**Solution:** [Variante X - brief description]

**Changes:**
| File | Change |
|------|--------|
| `path/to/file.ts` | [What was changed] |

**Tests:**
- [x] Existing tests pass
- [x] New tests added: [test file names]

**Docs Updated:**
- [List or "None required"]

**Verification:**
1. [Step to verify the fix]
2. [Step to verify no regression]

**Ready for Review:** Yes
```

---

# QUICK REFERENCE

```
PHASE 0: BRANCH CHECK
└── [GATE] Not on master/main?

PHASE 1: CLARIFICATION
└── Ask all unclear questions upfront (if any)

PHASE 2: DEEP EXPLORATION
├── Launch exploration agents
├── Root cause analysis
├── Check git history for regressions
└── Self-reflection

PHASE 3: CONFIDENCE GATE
├── Present structured understanding (max 10 sentences)
├── State confidence %
└── [GATE] Wait for user GO

PHASE 4: SOLUTION VARIANTS
├── Generate 3 variants with Pro/Contra
├── Recommend best solution
└── Confirm selection with user

PHASE 5: IMPLEMENTATION
├── Execute autonomously
├── Adapt/create tests
├── Run tests (must pass)
└── Update docs if needed

PHASE 6: COMPLETION
└── Generate final report
```

---

# AGENT USAGE GUIDELINES

**When to use agents:**
- Exploration: Always use the Explore agent for codebase understanding
- Complex analysis: launch several Explore agents with disjoint questions rather than one broad one
- Low confidence (<80%): Consult additional agents before proceeding

**Parallel execution:**
- Launch multiple exploration agents in parallel when possible
- Use background agents for long-running analysis

**Quality over speed:**
- High code quality is priority
- Follow existing patterns in codebase
- No shortcuts that compromise maintainability
