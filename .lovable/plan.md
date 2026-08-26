# Job Board: Accurate Experience Levels, Internships & Tracks

## What's wrong today (verified)

- The daily job importer hard-codes every imported job as `career_level: 'entry_level'` — including the quota fallback rows.
- Result in the live database: 204 of 206 jobs are tagged "Entry Level", and **75 of them have senior-style titles** (Senior, Sr, Staff, Lead, Director, Principal, Manager) while **10 are actually internships**.
- There is no internship flag, no role track, and no source URL field, so students can't isolate internships or filter by domain.

## What we'll build

### 1. New job fields

Add to the `jobs` table:

- `experience_level` — Internship / Entry Level / Mid Level / Senior / Lead-Executive
- `is_internship` — true/false (default false)
- `track` — Software Engineering, Frontend, Backend, Data & AI, Cybersecurity, Cloud/DevOps, Mobile, IT/Systems, Other
- `source_url` — where the listing came from

The existing `career_level` and `work_arrangement` fields stay in place so the admin job form and admin list keep working; `career_level` is kept in sync automatically.

### 2. Automatic classification so this never drifts again

Instead of only fixing today's rows, classification happens in the database on every insert and update, so imported jobs, admin-created jobs, and fallback rows are all tagged consistently.

Rules, applied to title first, then description:

- Contains Intern, Internship, Co-op, Fellow, Apprentice → `is_internship = true`, level "Internship"
- Contains Sr, Senior, Staff, Principal, Lead, Director, Head of, Manager, VP, Architect, or asks for more than 3 years of experience → never "Entry Level" (Senior, or Lead/Executive for Director/VP/Head)
- Mid-level cues (Mid, II/III, 2-5 years) → "Mid Level"
- Junior / Entry / Associate / Graduate / New Grad / 0-2 years → "Entry Level"
- Otherwise → "Mid Level" (safe default rather than mislabeling as entry level)

Track is matched from keywords: security/SOC/pentest → Cybersecurity; data/ML/AI/analytics → Data & AI; cloud/DevOps/SRE/Kubernetes → Cloud/DevOps; frontend/React/UI → Frontend; backend/API/Java/Go → Backend; iOS/Android/mobile → Mobile; sysadmin/helpdesk/network → IT/Systems; else Software Engineering.

Then a one-time backfill re-classifies all existing rows, which corrects the 75 mislabeled senior roles and flags the 10 internships.

### 3. Job page (/jobs) updates

- A prominent **"Internships & Early Career"** pill at the top of the page (next to search) that instantly narrows to internships and entry-level roles, with a live count.
- Quick pill row for **Track / Domain**: All, Software Engineering, Data & AI, Cybersecurity, Cloud/DevOps, IT/Systems (plus Frontend, Backend, Mobile).
- **Experience Level** becomes a single dropdown: All, Internship, Entry Level, Mid Level, Senior, Lead/Executive — replacing the current checkbox list.
- Work arrangement and location filters stay, moved into the same collapsible panel; "Clear" resets every filter including the new ones.
- Job cards show three accurate badges: experience level (internship styled with the success/accent token), track, and workplace type (Remote / Hybrid / On-site). Internship cards also get a subtle "Great for students" marker.

### 4. Importer update

`fetch-daily-jobs` stops hard-coding entry level: it sends `source_url`, lets the database classifier assign level/track/internship, and its fallback internship rows are labeled correctly.

## Technical notes

- Migration: `ALTER TABLE public.jobs` adds the four columns; a `normalize_job_classification()` trigger function (BEFORE INSERT OR UPDATE) does the regex parsing and also mirrors the result into the existing `career_level` enum; one `UPDATE public.jobs SET title = title` style touch-up backfills existing rows through the same function. Indexes on `is_internship`, `experience_level`, `track` for filter speed.
- `src/hooks/useJobs.ts`: unchanged shape (`select("*")`), types regenerate after the migration.
- `src/pages/Jobs.tsx`: filter state extended with `earlyCareerOnly`, `experienceLevel` (single value), `track`; badge maps updated to read the new fields with a fallback to `career_level` for any stale row.
- `supabase/functions/fetch-daily-jobs/index.ts`: drop `career_level: 'entry_level'`, add `source_url`, keep the `title,company` upsert conflict target.
- Admin `JobFormModal` keeps its current career-level select; the trigger normalizes whatever is submitted, so no admin UI change is required.
