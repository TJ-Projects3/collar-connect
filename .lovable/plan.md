

# Career Mapping Feature -- 3-Phase Implementation Plan

## Overview
A 16-question career assessment quiz across 4 sections that matches users to career tracks (Cloud, Security, Data, Systems/DevOps) using a weighted scoring model. All questions contribute to scoring, with Section 4 carrying 3x weight.

---

## Phase 1: Frontend (UI and Scoring Logic)

Build the complete quiz experience with local state only -- no database calls yet.

### New Files

**`src/lib/career-scoring.ts`**
- Define all 16 questions as a structured array, grouped by section:
  - Section 1: Technical Foundation (4 questions)
  - Section 2: AI Exposure (4 questions)
  - Section 3: Market Readiness (4 questions)
  - Section 4: Directional Preference (4 questions)
- Each question includes: section number, statement text, and a weight map (which tracks it contributes to and at what multiplier)
- Weight mapping:
  - Section 4 questions: 3x weight, one-to-one with tracks (Q1->Cloud, Q2->Security, Q3->Data, Q4->DevOps)
  - Section 1-2 questions: 1x weight, mapped to relevant tracks (e.g., "security concepts" -> Security x1)
  - Section 3 questions: readiness-only, no track contribution
- `computeCareerResults(answers)` function returns:
  - `tracks`: sorted array of `{ name, score, maxScore, percentage }` for each career track
  - `readiness`: 0-100 percentage from Sections 1-3 average
- Career track metadata: name, description string, associated Lucide icon name, and a color token

**`src/pages/CareerMapping.tsx`**
- Two views managed by local state:

  **Quiz View (multi-step stepper):**
  - Intro screen with a brief explanation and "Start Assessment" button
  - Progress bar at the top showing current section (e.g., "Section 2 of 4 -- AI Exposure")
  - Each step renders 4 statements with a 5-point radio group per statement (Strongly Disagree to Strongly Agree, values 1-5)
  - Back / Next buttons; Next is disabled until all 4 questions in the current section are answered
  - Final section shows "See My Results" instead of "Next"
  - Clicking "See My Results" calls `computeCareerResults()` and switches to results view

  **Results View:**
  - Primary career match: large Card with track icon, name, description, and match percentage
  - Secondary match: smaller Card below
  - Readiness score: labeled Progress bar (percentage)
  - Full breakdown: all 4 track scores as horizontal bars with percentages
  - "Retake Assessment" button resets local state back to the intro screen

- Uses existing components: Card, Button, RadioGroup, RadioGroupItem, Progress, Badge, Separator, Label

### Modified Files

**`src/App.tsx`**
- Import CareerMapping page
- Add `/career-mapping` as a protected route

**`src/pages/Feed.tsx`**
- Add a "Career Mapping" sidebar link with a Compass icon, placed between "Calendar" and the Settings separator

At the end of Phase 1, the quiz is fully functional in-browser but nothing is persisted.

---

## Phase 2: Backend (Database Table and Hooks)

Create the Supabase table and React Query hooks.

### Database Migration

```sql
CREATE TABLE public.career_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.career_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments"
  ON public.career_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON public.career_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments"
  ON public.career_assessments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_career_assessments_user_id
  ON public.career_assessments(user_id);
```

### New Files

**`src/hooks/useCareerAssessment.ts`**
- `useCareerAssessment()` -- React Query hook that fetches the most recent assessment for the current user (ordered by `completed_at` desc, limit 1)
- `useSaveAssessment()` -- mutation that inserts a new row with the user's answers and computed results
- `useDeleteAssessment()` -- mutation that deletes an assessment by ID (used for retake), invalidates the query cache

### Modified Files

**`src/integrations/supabase/types.ts`**
- Add the `career_assessments` table type definitions (Row, Insert, Update, Relationships)

At the end of Phase 2, the hooks exist but are not yet called from the UI.

---

## Phase 3: Connect Frontend to Backend

Wire the hooks into the CareerMapping page so results persist and load on revisit.

### Modified Files

**`src/pages/CareerMapping.tsx`**
- Import and call `useCareerAssessment()` on mount
  - If a previous assessment exists, skip the quiz and show the results view immediately
  - Show a loading state while fetching
- After computing results on "See My Results", call `useSaveAssessment()` to persist answers and results to the database
- "Retake Assessment" calls `useDeleteAssessment()`, then resets local state to the intro screen
- Add toast notifications for save success/failure

### No other files need changes in this phase.

---

## Summary

| Phase | What | Files touched |
|-------|------|---------------|
| 1 | UI stepper, scoring logic, routing, sidebar link | `career-scoring.ts` (new), `CareerMapping.tsx` (new), `App.tsx`, `Feed.tsx` |
| 2 | Database table, RLS, React Query hooks, types | Migration SQL, `useCareerAssessment.ts` (new), `types.ts` |
| 3 | Wire hooks into the page for persistence | `CareerMapping.tsx` |

