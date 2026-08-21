# Fix Q&A Upvote Counting and Instant UI Sync

## What I found (verified)

- There is no `question_upvotes` / `answer_upvotes` table. Both questions and answers share one table, `question_votes` (`user_id`, `question_id` or `answer_id`, `value` = +1 or -1).
- The displayed score is a stored `upvotes` column on `questions` / `question_answers`, kept in sync by a trigger that adds/subtracts on insert/update/delete. It is a running sum, not a boolean or clamp.
- The stored counter has already drifted: one live question shows `upvotes = 1` while the vote table actually holds 2 upvotes for it. So the number users see is wrong today.
- `question_votes` has no uniqueness rule per user per target, so the same user can be recorded more than once.
- The UI has no optimistic update: after a click it waits for a refetch of every Q&A query, so the number visibly lags.

## Plan

1. Make the count authoritative
   - Add a uniqueness rule so each user can have at most one vote row per question and per answer.
   - Remove any duplicate rows before adding it (keep the newest per user/target).
   - Recompute every `upvotes` value from the actual vote rows so displayed scores match reality.
   - Keep the trigger, but recompute the affected row's total directly from the vote table on each change instead of nudging the old number up or down. That makes drift impossible going forward.

2. Make voting write exactly one row
   - Switch the vote mutation to a single upsert on the uniqueness rule (click same arrow again = delete the row), so a rapid double-click can never create two rows.

3. Instant UI feedback
   - On click, immediately update the shown score and highlight the arrow from cached data (score +1/-1/+2 depending on the previous state), then reconcile with the database result.
   - Roll the optimistic change back and show the existing error toast if the write fails.

## Technical notes

- Migration: dedupe `question_votes`, add `UNIQUE (user_id, question_id)` and `UNIQUE (user_id, answer_id)` as partial unique indexes (the columns are mutually exclusive and nullable), rewrite `public.qa_apply_vote()` to `SET upvotes = (SELECT COALESCE(SUM(value),0) FROM question_votes WHERE ...)`, then backfill both tables with the same expression.
- `src/hooks/useQuestions.ts`: rewrite `useVote` to use `upsert(..., { onConflict })` / `delete`, and add `onMutate` / `onError` / `onSettled` handlers that patch the `["questions"]`, `["question", id]`, `["question-answers", id]`, and `["question-votes", ...]` caches.
- `src/pages/Community.tsx` keeps reading `q.upvotes` and the vote maps, so no UI change is needed beyond what the cache patch provides.

## Note on the request

Counting only `+1` rows (`COUNT(*)`) would ignore downvotes, which the UI currently supports with a down arrow. The plan keeps the net score (sum of +1/-1). Say the word if you'd rather drop downvotes entirely and show a pure upvote count.
