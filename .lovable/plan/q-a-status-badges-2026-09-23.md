# Q&A Status Badges

Replace the plain answer-count pill on Community question cards with a real status badge, and stop trusting the stored counter that is currently wrong.

## What the user sees

Each question card (and the question detail header) shows one status badge:

- **No Answers Yet** — muted/outline badge, 0 answers.
- **Active Discussion (3 answers)** — neutral/primary-tinted badge, 1 or more answers and none accepted.
- **Resolved** — green success badge with check icon, one answer is marked accepted. Answer count still shown next to it.

## Why the change is needed

The stored `answer_count` on `questions` does not match reality today. Both existing questions have 2 answers, but the column says 0 and 1. So the current pill already shows wrong numbers, and the "Unanswered" filter hides/shows the wrong questions.

## Technical details

**Data**
- One migration: recompute `questions.answer_count` from `question_answers` for all rows so the stored counter is correct going forward (the insert/delete trigger `qa_answer_count` already exists and stays).
- No new column for accepted state. The feed query derives it.

**`src/hooks/useQuestions.ts`**
- After loading the question rows, run a single follow-up select on `question_answers` (`question_id, is_accepted`) filtered to the visible question ids, and reduce it into per-question `answerCount` and `hasAcceptedAnswer`.
- Add both to the `Question` type; keep `answer_count` for compatibility but prefer the derived value in the UI.
- Change the `unanswered` sort so it filters on the derived count instead of `answer_count`, so it can't drift again.
- Do the same derivation in `useQuestion` for the detail view.

**`src/components/community/QuestionStatusBadge.tsx`** (new)
- Small presentational component taking `answerCount` and `hasAcceptedAnswer`, rendering the three states using existing semantic tokens (`success` / `success-foreground` for resolved, `outline` and `secondary` variants otherwise). No hardcoded colors.

**`src/pages/Community.tsx`**
- Swap the badge at the card footer for `QuestionStatusBadge`.
- Add the same badge to the question detail header next to the title metadata.
