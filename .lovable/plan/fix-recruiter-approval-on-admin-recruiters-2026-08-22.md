# Fix recruiter approval on /admin/recruiters

## What's actually broken

The approval click does reach the database — it just gets silently undone.

Evidence: the only recruiter account (Kelly Crawmer) still shows `pending` / not verified, but its `updated_at` is `2026-08-22 00:07:26 UTC` — the moment the Approve button was pressed. So the write happened and something reverted the values in the same statement.

The cause is the `protect_verified_recruiter` safety trigger on `profiles`. It runs before every update and, unless the *current session* is an admin, it silently rolls `recruiter_status` and `is_verified_recruiter` back to their old values (no error raised). The approval runs through the `recruiter-status` edge function using the service role key, which has no signed-in user, so the trigger's admin check fails and the change is discarded. The function then reports success and sends the email, which is why the UI looks like it worked but the badge and tab counters never change.

Frontend note: the query invalidation on success is already correct, so once the database write sticks, the card will move tabs on refetch. The remaining UI work is making that feel instant.

## The fix

1. **Database (the real bug)** — update the `protect_verified_recruiter` trigger so it also treats trusted server-side callers (the service role used by the edge function) as privileged, alongside admins. Regular signed-in users and visitors remain blocked from changing their own verification status, exactly as today.

2. **Backfill** — set the one recruiter whose approval was silently dropped back to `pending` state untouched; no backfill is needed since no approval actually committed. The admin can simply re-click Approve after the fix.

3. **Edge function hardening** — after the update, re-read the row and confirm the status actually changed. If it didn't, return an error instead of a success + email, so a future silent revert can never masquerade as success again.

4. **Instant UI feedback** — add an optimistic cache update to the approve/reject mutation so the badge flips and the Pending / Approved / Rejected counters recalculate the moment the button is clicked, rolling back if the server rejects the change. The existing refetch stays as the source of truth.

## Technical details

- `public.protect_verified_recruiter()`: privileged check becomes `public.has_role(auth.uid(), 'admin') OR coalesce(auth.jwt() ->> 'role', '') = 'service_role'`. The existing logic that keeps `is_verified_recruiter` aligned with `recruiter_status` is kept.
- `supabase/functions/recruiter-status/index.ts`: change the update to `.select("recruiter_status, is_verified_recruiter").maybeSingle()` and return a 500 with a clear message when the returned `recruiter_status` does not match the requested status.
- `src/hooks/useRecruiterReview.ts`: add `onMutate` to `useRecruiterDecision` that cancels in-flight `["recruiterReview"]` fetches, snapshots the list, patches the target row's `recruiter_status` and `is_verified_recruiter`, and restores the snapshot in `onError`. Keep `invalidateQueries` in `onSettled`.
- No schema, column, or RLS-policy changes are needed: the page already reads and writes `profiles.recruiter_status` / `profiles.is_verified_recruiter`, which are the correct columns, and admin authorization is enforced inside the edge function via `has_role`.
