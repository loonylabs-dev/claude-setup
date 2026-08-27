---
description: 'Execute ONE story with progress tracking, auto-commit, and completion report. Pass story file paths as arguments.'
disable-model-invocation: true
---

# Execute Story

## Using agents

Work on your own by default. **No subagents, background agents or `Workflow` runs without
asking** — ask briefly ("May I use agents for this? Reason: …") and wait for an explicit yes.

**Exception:** if the user has already cleared agents for this story, or asked for them
themselves, that clearance holds for the story and you do not ask again.

## Setup

If this is the first story: check whether we need a branch — we do not want to work on master.

## Load the context

Read ALL the stories passed in, thoroughly and completely (lessons learned, handover,
ticked-off tasks) so you hold the full context:

$ARGUMENTS

## Implementation

Identify the **next open story** (the first one with unfinished tasks) and implement
**ONLY THAT ONE**:

1. **Analyse** what is needed and start once your confidence is sufficient
2. **Update the tasks** in the story document as you go (tick the checkboxes)
3. **Fill in at the end:**
   - Lessons Learned (what went well, architecture decisions, technical debt)
   - Handover to the follow-up story (context, relevant files, starting prompt)

## Closing out (IMPORTANT — after EVERY story)

Once the story is done, these steps in order:

### 1. Run the tests
Run the project's relevant tests and make sure nothing broke. Which ones those are is in
the project's `CLAUDE.md` or its `package.json` scripts — when in doubt, the full unit
suite plus the E2E/integration tests covering the flows you touched. If a lane needs
running infrastructure (database, dev server), check that first instead of starting blind.

### 2. Auto-commit
Create a commit whose message references the story (e.g. `feat(feature): implement Story N
— short description`).

### 3. Completion report
Give a compact closing report:

- **Story**: name and number
- **What was done**: 3-5 bullet points
- **Key files**: new and changed files
- **Next story**: name + short description (if there is one)
- **Notes**: open points, workarounds, anything unusual

### 4. Testing notes
Say clearly what is already checked and what still needs hands:

- **Tested by me**: which automated tests ran, which functional checks you did yourself
- **Recommended to check manually**: what the user should look at (UI interactions, edge
  cases, integration points)
- **Could still test**: what else is feasible, if they want it

### 5. STOP
**End the work here.** Do NOT implement the next story automatically. The user decides how
to continue (new session, next story, a break, a review).
