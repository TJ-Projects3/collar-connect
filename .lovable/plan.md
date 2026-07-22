## Goal
When RapidAPI returns 429 (quota exceeded), fall back to inserting 5 realistic sample tech internship jobs into the `jobs` table instead of skipping the sync.

## Changes

**`supabase/functions/fetch-daily-jobs/index.ts`**
- In the existing 429 branch (currently returns "sync skipped"), instead:
  1. Build an array of 5 realistic sample internship listings, e.g.:
     - Software Engineering Intern — Google — Mountain View, CA
     - Cybersecurity Analyst Intern — CrowdStrike — Remote
     - Data Analyst Intern — Meta — Menlo Park, CA
     - AI/ML Engineering Intern — NVIDIA — Santa Clara, CA
     - IT Support Intern — Microsoft — Redmond, WA
  2. Each row matches the current `jobs` upsert schema (title, company, location, description, apply_url, employment_type='Internship', experience_level='Entry Level', work_arrangement, source='sample', posted_at=now, etc.), with a deterministic `external_id` like `sample-<slug>` so re-runs upsert cleanly without duplicating.
  3. Upsert the 5 rows using the same code path as normal syncs.
  4. Return `200` with `{ status: 'quota_exceeded_fallback', inserted: 5 }`.

**`src/components/admin/JobsTab.tsx`**
- Handle the new `quota_exceeded_fallback` status in the sync toast: show "Quota exceeded — inserted 5 sample jobs" instead of the generic skipped message.

## Notes
- No DB schema changes needed.
- Sample jobs are idempotent via fixed `external_id`s, so repeated 429s won't spam the table.
