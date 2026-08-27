---
description: 'Turn prepared UX/feature documents into implementation-ready stories. Interactive workflow with clarifying questions.'
disable-model-invocation: true
---

# Story Creation Workflow

You help me turn prepared documents into a coherent set of stories, each of which can be
built as **one coherent, independently testable deliverable in a single focused session**
— with no further questions needed.

How many stories there are follows from the scope and complexity of the work: it might be
2, it might be 5, it might be more.

## STORY SIZE: THE STANCE

**Merge by default.** Split only at one of the two real seams:
- **Hard dependency**: story B cannot even be designed without the output of story A.
- **Genuinely standalone deliverable**: a result that is testable and meaningful on its own.

"More stuff" is **not** a seam. What looks like a full human day is often a single session
for you as an AI — do not underestimate your own speed, or you will cut artificially small.

The measure of size is **cohesion, not time**: one story = one connected thread that can be
built and verified in one go. There are deliberately **no hour estimates** — an AI cannot
give those honestly, for a human or for itself.

## The stories themselves

The stories are project artefacts, so they are written in whatever language that project's
own artefacts use — check its `CLAUDE.md`. Everything else about language follows
`language.md`; the template blocks below are instructions to you, not strings to copy out
verbatim.

## PHASE 1: ANALYSIS

Read the preparation documents first and identify:

1. **Core problem**: what is being solved?
2. **Main components**: what has to be built (DB, API, UI, hooks)?
3. **Dependencies**: what builds on what?
4. **Complexity**: into how many stories does this sensibly split?

## PHASE 2: DOCUMENT YOUR UNDERSTANDING + ASK

**IMPORTANT**: after reading the documents, ALWAYS output this structure:

```
## What I understood ✅

**Current confidence: [X]%**

### Core concept
[Summary of the main concept in 3-5 sentences]

### Main components
- [Component 1]: [short description]
- [Component 2]: [short description]
- ...

### Story cut (compact)

Cut **compact**: few, large stories, aggressively merged, split only at hard seams (a hard
dependency or a genuinely standalone deliverable). This is the **working assumption**, not
a proposal to be nodded through — there is no intermediate step where the user picks an
option.

- Story 1: [name] — [what is in it]
- Story 2: [name] — [what is in it]

If the cut is too coarse or too fine for you, say so — otherwise I carry straight on with it.

---

## Confidence status

[At ≥95%: "I am ready for the final cut (phase 3)."]
[Below 95%: "I have X open questions — we'll work through them one at a time."]
```

**Goal: reach 95% confidence before any story is written.**

Important: do **not** stop for approval of the cut. Output the compact cut and flow
**straight on** into the confidence handling in the same pass.

### When confidence is ≥ 95%

No open questions. On to phase 3.

### When confidence is < 95% → start step-by-step mode AUTOMATICALLY

Do **not** dump every open question at once (no question barrage). Instead:

1. Invoke the `step-by-step` skill (Skill tool, name `step-by-step`) and clear the open
   questions **one at a time** under its rules: one question at a time, pros and cons per
   option, UX focus, with an explicit recommendation.
2. This workflow's open questions are the list step-by-step works through — sorted by
   dependency (what shapes other decisions first, e.g. the story cut).
3. After **every** answered question: update your understanding, carry the new confidence
   forward internally.
4. Once the questions are through: output the updated confidence. Still below 95% and new
   questions surfaced? → the same treatment again via step-by-step, not as a block.
5. Only at ≥ 95% move to phase 3.

## PHASE 3: FINALISE THE STORY CUT

At ≥ 95% confidence, take the **compact cut from phase 2** and propose the final split with:
- **Title**: short and sharp
- **Scope**: what is in, what is not (out of scope)
- **Dependencies**: which story needs which other
- **Core tasks**: 3-5 main points per story

Example format:
```
Story 1: [name] (no dependencies)
- Create DB migration
- Implement base components
- 2-3 core rules/features

Story 2: [name] (needs story 1)
- Extended features
- Integration with story 1
- Tests
```

Get a final confirmation before carrying on.

## PHASE 4: WRITE THE STORIES

After my confirmation, write all stories under `docs/stories/`.

**Reference**: for the full template structure with code examples see
`~/.claude/skills/create-stories-from-docs/story-template.md`, next to this file. If the
project has its own version at `.claude/templates/story-template.md`, that one wins.

Short form of the structure:

### Story file structure

```markdown
# Story [N]: [name]

**Feature**: [feature name]
**Type**: New Feature | Enhancement | Bugfix
**Scope**: 1 session (one coherent deliverable in one sitting)
**Dependencies**: Story N (or "None")
**Related Stories**: Story N+1, Story N+2

---

## Code Standards (IMPORTANT!)

[Story 1 defines the standards, every other story references story 1]

For story 1:
- Design tokens (no hardcoded colours)
- Use the Button component
- Components instead of inline rendering
- CSS variables for animations

For story 2+:
See [Story 1 - Code Standards](./[prefix]01_[name].md#code-standards-important)

---

## Context & Background

### The Problem
[1-2 sentences: what is the problem?]

### The Solution
[1-2 sentences: what is the solution?]

### Story [N] Scope
[What is in this story?]

**Out of Scope (future stories):**
- [What goes into other stories]

---

## User Stories

**As a** [user role]
**I want** [feature/action]
**So that** [benefit/goal]

---

## Acceptance Criteria

### ✅ Definition of Done

#### [Category 1, e.g. Database]
- [ ] [Criterion 1]
- [ ] [Criterion 2]

#### [Category 2, e.g. UI Components]
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## Technical Specification

### Database Schema (where relevant)

```sql
-- Tables, indexes, RLS policies
```

### Component Structure

```
src/
├── lib/
│   └── [feature]/
└── components/
    └── [Feature]/
```

### Core Types

```typescript
// TypeScript interfaces
```

### [Further relevant specs: API routes, hooks, etc.]

---

## Test Plan

### Unit Tests
[Test examples with expect()]

### Integration Tests
[E2E or integration test examples]

---

## Task List (Progress Tracking)

- [ ] [Task 1]
- [ ] [Task 2]
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual QA
- [ ] Docs update per project convention (if the DB changed and the project keeps a schema overview)
- [ ] **Fill in Lessons Learned** (after implementation)
- [ ] **Write the handover for the follow-up story** (starting prompt for the next session)

---

## Notes & Considerations

### Performance
[Performance notes]

### UX
[UX notes]

### Future Enhancements (Out of Scope)
[What might come later]

---

## Dependencies & Blockers

**Dependencies**: [Story N or None]
**Blockers**: [Known blockers or None]

---

## Success Metrics

[Measurable success criteria after seven days]

---

## Lessons Learned

<!-- FILL IN AFTER IMPLEMENTATION - used as context by the follow-up story -->

### What went well
### Architecture decisions
### Technical debt / workarounds
### Important files created or changed
### Open points for follow-up stories

---

## Handover to the follow-up story

<!-- FILL IN AFTER IMPLEMENTATION - starting prompt for the next chat session -->

### Context summary
### Files worth reading first
### Starting prompt for story [N+1]

---

**End of Story [N]**
```

## PHASE 5: CONSISTENCY CHECK

Before saving, check:
- [ ] Stories reference each other correctly (dependencies are right)
- [ ] Code standards defined in story 1, every other story references them
- [ ] No duplicated logic between stories
- [ ] Every story with DB changes has a docs-update task (if the project keeps a schema overview)
- [ ] Components are created as their own files (not inline)
- [ ] Naming convention: `[prefix][nr]_[name].md` (e.g. `jf01_judy-foundation.md`)

## PHASE 6: SUMMARY

Give me at the end:
1. An overview of every story created
2. The recommended implementation order
3. An estimate of the overall duration
4. What I should pay particular attention to

---

## PHASE 7: OPTIONAL DEEP VALIDATION

**After phase 6, ALWAYS ask this:**

```
Would you like an additional validation pass?

I can go through it again thoroughly, looking for:
- Implicit assumptions that should be flushed out
- Edge cases that were forgotten
- Missing specifications (error handling, loading states, empty states)
- Inconsistencies between the stories
- Overlooked technical dependencies
- Unclear or ambiguous acceptance criteria
- Missing tests or test scenarios
- Documentation gaps (DB schema, i18n, translations)

[yes] / [no]
```

### On "yes": run the deep validation

**Procedure:**

1. **Re-read every source**:
   - All the original UX/feature documents again
   - All the stories you created again
   - Where needed: the relevant parts of the codebase (existing components, similar patterns)

2. **Work through a systematic checklist.**

   > The points below are categories, not a mandatory list. The ones marked *(if applicable)*
   > assume a particular stack — skip them where the project does not have it, and add the
   > categories this project needs instead. The conventions come from the project's
   > `CLAUDE.md`, not from this skill.

   - **Implicit assumptions**: what is silently taken for granted? (e.g. "the user is logged
     in", "the feature flag is on", "the data is already migrated")
   - **Edge cases**: what happens with empty data, network errors, concurrent changes, very
     large volumes?
   - **Error handling**: is every failure path specified? How does the UI react?
   - **Loading & empty states**: are these explicitly defined?
   - **Permissions**: are all the access rules clear? *(if applicable: RLS policies or similar)*
   - **i18n** *(if applicable)*: do new translation keys have to be added? In which file —
     mind the merge rules the project documents for that
   - **Schema validation** *(if applicable)*: are the validation schemas updated in the right
     places?
   - **Responsive behaviour** *(if applicable)*: is the behaviour clear at the project's
     breakpoints?
   - **Accessibility**: keyboard navigation, ARIA labels, focus management?
   - **Performance**: pagination, caching, N+1 queries?
   - **Test coverage**: are the critical paths covered? Are integration or E2E tests missing?
   - **Migrations** *(if applicable)*: right order? Rollback possible? Docs update per project
     convention planned?

3. **Present the findings in a structure**:

```
## Deep validation: findings 🔍

### 🔴 Critical (should be settled before implementation)
1. **[Story X] [topic]**
   - **Problem**: [what was overlooked or underspecified]
   - **Proposal**: [a concrete way to solve it]
   - **Question for you**: [what does the user have to decide?]

### 🟡 Important (improvement recommended)
2. **[Story X] [topic]**
   - **Problem**: ...
   - **Proposal**: ...
   - **Question for you**: ...

### 🟢 Nice to have (enrichment)
3. **[Story X] [topic]**
   - **Observation**: ...
   - **Proposal**: ...

---

**Would you like me to:**
- [a] Work every finding, with your answers, into the stories
- [b] Work in only the critical ones (🔴)
- [c] Selectively (you say which)
- [d] Change nothing (this was information only)
```

4. **Collect the answers**: note the answer per finding.

5. **Update the stories**: once every finding is answered, enrich the affected stories:
   - Add new acceptance criteria
   - Add edge cases to the test plan
   - Extend the technical specification
   - Update notes & considerations
   - Sharpen dependencies and out-of-scope

6. **Confirm the update**: a short list of what changed where, then finish.

### On "no": finish here

The workflow is done. A short note: "if something occurs to you later, you can add it any time."

---

## IMPORTANT: after the story is implemented

Every story ends with two blocks that have to be filled in **AFTER implementation**:

### 1. Lessons Learned
- What went well
- Architecture decisions (with reasoning)
- Technical debt / workarounds
- Important files created or changed
- Open points for follow-up stories

### 2. Handover to the follow-up story
- Context summary (2-3 sentences)
- Files worth reading first (for the next session)
- **Starting prompt** for story N+1 (copy-paste ready)

**Why?** Every story is implemented in a separate chat session. The handover block gives the
next session the context it needs.

---

## Quality criteria

### Must-haves
- Implementable on its own, with no further questions
- One coherent, independently testable deliverable per story (no hour estimates — see the
  stance on story size)
- Clear acceptance criteria as a checklist
- Code examples for the critical parts
- Explicit tasks for documentation
- **Lessons Learned + handover blocks** (filled in after implementation)

### Code standards (the ones story 1 defines)

The standards come from the PROJECT, not from this skill: read `CLAUDE.md` and where
relevant `DESIGN.md`, and carry those rules into story 1 verbatim. If there are none, ask
rather than invent. The list below is only a set of typical categories, using a web project
as the example:

1. **Design tokens** - `bg-panel`, `text-text-primary` instead of `bg-white`, `text-gray-900`
2. **Button component** - `<Button variant="cta">` instead of inline `<button className="...">`
3. **Create components** - `<ItemCard>` instead of inline JSX in map()
4. **No inline styles** - except for dynamic values (left, top, width, height)
5. **CSS variables** - `hsl(var(--accent-violet) / 0.7)` instead of `rgba(139, 92, 246, 0.7)`
