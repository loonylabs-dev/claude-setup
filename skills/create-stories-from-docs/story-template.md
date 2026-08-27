# Story Template

Template reference for implementation-ready stories.
Used by the `/create-stories-from-docs` skill.

> **Worked example on the stack of a Next.js/Supabase project.** Only the **structure**
> is binding (the sections and their order). The code, task and schema examples are to be
> replaced per project — the conventions come from that project's `CLAUDE.md`, not from
> this file.

---

## Template

```markdown
# Story [N]: [Story Name]

**Feature**: [Feature name]
**Type**: New Feature | Enhancement | Bugfix
**Scope**: 1 session (one coherent deliverable in one sitting)
**Dependencies**: Story N | None
**Related Stories**:
- Story [N+1]: [Name] (builds on this)
- Story [N-1]: [Name] (REQUIRED)

---

## Code Standards (IMPORTANT!)

<!-- STORY 1: define the standards here -->

### 1. Design tokens - no hardcoded colours

```tsx
// ❌ WRONG
<div className="bg-violet-500 text-white" />

// ✅ RIGHT
<div className="bg-primary text-text-inverse" />
```

**Available tokens** (from `tokens.css`):
- Backgrounds: `bg-panel`, `bg-surface`, `bg-highlight-hover`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Borders: `border-border`
- Accents: `text-accent-violet`, `text-accent-mint`

### 2. Use the Button component

```tsx
// ❌ WRONG
<button className="px-4 py-2 bg-violet-500 text-white rounded-md">Click</button>

// ✅ RIGHT
<Button variant="cta">Click</Button>
```

**Variants**: `cta` (mint), `nav` (violet), `primary`, `secondary`, `danger`

### 3. Components instead of inline rendering

```tsx
// ❌ WRONG
{items.map(item => <div className="p-4 border">{item.title}</div>)}

// ✅ RIGHT
{items.map(item => <ItemCard key={item.id} item={item} />)}
```

### 4. CSS variables for animations

```css
/* ❌ WRONG */
box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7);

/* ✅ RIGHT */
box-shadow: 0 0 0 0 hsl(var(--accent-violet) / 0.7);
```

<!-- STORY 2+: reference story 1 -->
See [Story 1 - Code Standards](./[prefix]01_[name].md#code-standards-important)

---

## Context & Background

### The Problem
[Describe the problem in 2-3 sentences. What does not work? What is missing?]

### The Solution
[Describe the solution in 2-3 sentences. What gets built?]

### Story [N] Scope
This story implements:
1. [Main component 1]
2. [Main component 2]
3. [Main feature 3]

**Out of Scope** (future stories):
- [What is not in this story]
- [What comes in story N+1]

---

## User Stories

**As a** new user
**I want** helpful guidance when I'm stuck
**So that** I can learn the app without documentation

**As a** returning user
**I want** the assistant to remember what I've seen
**So that** I don't get repetitive tips

**As a** power user
**I want** to dismiss or minimize the assistant
**So that** it doesn't get in my way

---

## Acceptance Criteria

### ✅ Definition of Done

#### Database
- [ ] Migration creates `[table_name]` table
- [ ] Indexes on relevant columns
- [ ] RLS policies for user access

#### UI Components
- [ ] [Component 1] visible and functional
- [ ] [Component 2] with proper styling
- [ ] Responsive on mobile

#### Business Logic
- [ ] [Logic 1] works correctly
- [ ] [Logic 2] handles edge cases
- [ ] Error states are handled

#### Integration
- [ ] Hooks into [Feature 1]
- [ ] Triggers on [Event 1]

---

## Technical Specification

### Database Schema

```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  [field_1] TEXT NOT NULL,
  [field_2] INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_[table]_user_id ON [table_name](user_id);

-- RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON [table_name] FOR SELECT
  USING (auth.uid() = user_id);
```

### Component Structure

```
src/
├── lib/
│   └── [feature]/
│       ├── [feature]Types.ts        # TypeScript interfaces
│       ├── [feature]Service.ts      # API calls
│       └── [feature]Engine.ts       # Business logic
├── lib/contexts/
│   └── [Feature]Context.tsx         # React context
├── components/
│   └── [Feature]/
│       ├── [Component1].tsx
│       └── [Component2].tsx
└── app/api/
    └── [feature]/
        └── route.ts                  # API endpoint
```

### Core Types

```typescript
// src/lib/[feature]/[feature]Types.ts

export interface [MainType] {
  id: string;
  user_id: string;
  [field_1]: string;
  [field_2]: number;
  created_at: string;
}

export type [EnumType] = 'option1' | 'option2' | 'option3';

export interface [EventType] {
  type: string;
  payload: Record<string, unknown>;
}
```

### API Routes

```typescript
// src/app/api/[feature]/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  const { data, error } = await supabase
    .from('[table_name]')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### React Context

```tsx
// src/lib/contexts/[Feature]Context.tsx

'use client';

import React, { createContext, useContext, useState } from 'react';

interface [Feature]ContextValue {
  [state]: [Type];
  [action]: () => void;
}

const [Feature]Context = createContext<[Feature]ContextValue | null>(null);

export const [Feature]Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [[state], set[State]] = useState<[Type]>([initialValue]);

  return (
    <[Feature]Context.Provider value={{ [state], [action] }}>
      {children}
    </[Feature]Context.Provider>
  );
};

export const use[Feature] = () => {
  const context = useContext([Feature]Context);
  if (!context) throw new Error('use[Feature] must be used within [Feature]Provider');
  return context;
};
```

---

## Test Plan

### Unit Tests

```typescript
// tests/unit/[feature]/[feature]Engine.test.ts

describe('[Feature]Engine', () => {
  test('should [expected behavior]', async () => {
    const engine = new [Feature]Engine();
    const result = await engine.[method]([input]);
    expect(result).toBe([expected]);
  });

  test('should not [negative case]', async () => {
    const result = await engine.[method]([badInput]);
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
// tests/integration/[feature]/[feature]Flow.test.ts

describe('[Feature] Flow', () => {
  test('[Scenario] should [expected outcome]', async () => {
    const { getByText } = render(<[Component] />);

    await waitFor(() => {
      expect(getByText(/[expected text]/i)).toBeInTheDocument();
    });
  });
});
```

---

## Task List (Progress Tracking)

### Phase 1: Foundation
- [ ] Create migration: `[table]` table
- [ ] Create Supabase function (if needed)
- [ ] Implement [Feature]Types (TypeScript interfaces)
- [ ] Implement [Feature]Service (API calls)

### Phase 2: Core Logic
- [ ] Create API route: GET/POST `/api/[feature]`
- [ ] Implement [Feature]Engine (business logic)
- [ ] Create [Feature]Context (provider + hook)

### Phase 3: UI Components
- [ ] Create component: [Component1]
- [ ] Create component: [Component2]
- [ ] Add Tailwind animations (if needed)
- [ ] Integrate provider in root layout

### Phase 4: Integration
- [ ] Hook into [Feature 1]
- [ ] Hook into [Feature 2]

### Phase 5: Testing & Docs
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual QA
- [ ] Update DOC_TABLE_OVERVIEW.md (if the DB changed)

### Phase 6: Close-out & Handover
- [ ] **Fill in Lessons Learned** (after implementation)
- [ ] **Write the handover for the follow-up story** (starting prompt for the next session)

---

## Notes & Considerations

### Performance
- [Performance consideration 1]
- [Performance consideration 2]

### UX
- [UX principle 1]
- [UX principle 2]

### Mobile Considerations
- [Mobile note 1]

### Future Enhancements (Out of Scope)
- [Future feature 1]
- [Future feature 2]

---

## Dependencies & Blockers

**Dependencies**: Story [N] | None

**Blockers**: None

**Related Stories**:
- Story [N+1]: [Name] (builds on this)

---

## Success Metrics

Seven days after deployment:
- **[Metric 1]**: >[X]% [description]
- **[Metric 2]**: >[X]% [description]
- **[Metric 3]**: <[X]% [description]

---

## Lessons Learned

<!--
IMPORTANT: fill this block in at the end of the implementation.
It gets copied into the FOLLOW-UP STORY as context.
-->

### What went well
- [Win 1]

### Architecture decisions
- [Decision 1 and the reasoning]

### Technical debt / workarounds
- [What was not solved ideally, and why]

### Important files created or changed
<!-- The files that matter for the follow-up story's context -->
```
src/lib/[feature]/...
src/components/[Feature]/...
```

### Open points for follow-up stories
- [What story N+1 has to take into account]

---

## Handover to the follow-up story

<!--
This block is filled in AT THE END of the story implementation.
It doubles as the starting prompt for the next chat session.
-->

### Context summary
<!-- 2-3 sentences: what was implemented in this story? -->
[Summary of the implementation]

### Files worth reading first
<!-- The files Claude should read when the follow-up story starts -->
```
[path 1]
[path 2]
```

### Starting prompt for story [N+1]
<!-- Paste this block as the first prompt in the new chat session -->
```
I want to implement story [N+1]: [name of the follow-up story]

Read these first:
1. The story file: docs/stories/[prefix][N+1]_[name].md
2. The previous story with its Lessons Learned: docs/stories/[prefix][N]_[name].md
   (sections "Lessons Learned" and "Handover")
3. The relevant files from the previous story: [list]

Context from story [N]:
[short summary of what was implemented]

Things to watch out for:
[what matters from Lessons Learned]
```

---

**End of Story [N]**
```

---

## Checklist before saving

- [ ] Story number and name are consistent
- [ ] Dependencies are correct (story X needs story Y)
- [ ] Code standards defined in story 1, every other story references them
- [ ] Acceptance criteria as checkboxes [ ]
- [ ] Task list contains "Update DOC_TABLE_OVERVIEW.md" (if the DB changed)
- [ ] Task list contains explicit component tasks (not inline)
- [ ] Test plan with concrete test examples
- [ ] Out of scope clearly defined
- [ ] Filename: `[prefix][nr]_[name].md`
