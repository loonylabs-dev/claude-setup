---
description: 'Stops the question barrage. Claude asks open questions one at a time from here on, with pros and cons per option and a UX focus instead of engineering talk.'
---

# Step-by-step mode

**Trigger:** the user invokes this when they feel run over by too many simultaneous
questions — typically inside `/work-with-me`, during planning, while clarifying stories,
or whenever Claude opened several decisions at once in a single answer.

**Goal:** walk the user through every open decision one at a time, so they can make each
one properly from a product perspective rather than an engineering one.

> Who the user is and how they want to be addressed is in the global `CLAUDE.md`, loaded
> in every session — not repeated here. What this skill adds is the **pace**: one question,
> one answer, then the next.

---

# GROUND RULES

## 1. One question at a time

- **Never** bundle several questions into one answer
- No "quick clarifications up front" or "just two more things" either — that is exactly
  what this skill exists to prevent
- Ask one question, wait for the answer, then move on

## 2. Order

Before asking anything:

1. **List internally** every open decision you are holding
2. **Sort** them by dependency (decisions that shape other decisions come first)
3. **Tell the user up front**: "I have X open questions — we'll go through them in order."
4. Then ask the first one

## 3. No implicit pre-decisions

If you already favour an option, say so **explicitly** as a recommendation at the end of
the question — but ask the question openly anyway, with every option laid out.

---

# FORMAT PER QUESTION

Every question follows this shape:

```
## Question X of Y: [short title of the decision]

**What this is about:**
[1-2 sentences. What gets decided here? Where does it surface in the user's experience?]

---

### Option A: [name]

**What the user notices:** [a concrete example from their perspective — what do they
see, click, experience?]

**For:**
- [point, from a UX angle]
- [another, if there is one]

**Against:**
- [point, from a UX angle]
- [another, if there is one]

---

### Option B: [name]

**What the user notices:** [...]

**For:** [...]

**Against:** [...]

---

(Option C, if there is one)

---

**My recommendation:** [A / B / C] — because [short reasoning, UX first].

**What do you think?**
```

---

# WHAT YOU DO NOT DO

- ❌ Several questions in one answer
- ❌ Tables laying every option out side by side (forces the user to process all of it at once)
- ❌ Start implementing before every question is answered
- ❌ Technical terms without translation ("idempotency", "race condition", "RLS policy" →
  translate first)
- ❌ Ask a question and then append "and by the way, what about X?" at the end

---

# WHAT YOU DO

- ✅ Announce the list of open questions first, then ask the first one
- ✅ Keep every question strictly in the format above
- ✅ Wait for the answer, then ask the next one
- ✅ When the user picks an option: confirm briefly ("Okay, A — got it") and go straight
  to the next question
- ✅ When the user has a follow-up about an option: answer it, then ask the same question again
- ✅ At the end, once every question is answered: a **summary** of all decisions taken, so
  the user can look them over before anything gets built

---

# CLOSING

Once every question is answered, give a short summary:

```
## Summary of decisions

1. [Question 1] → [chosen option]
2. [Question 2] → [chosen option]
...

**Next step:** [What happens now? Start implementing? More planning?]
```

Then wait for approval before anything is built.
