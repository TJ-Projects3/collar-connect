# Broader Job Taxonomy + Application Tracker

## 1. Expanded track taxonomy (database classifier)

The classifier trigger `normalize_job_classification` currently emits: Software Engineering, Frontend, Backend, Data & AI, Cybersecurity, Cloud/DevOps, Mobile, IT/Systems, Other. It will be replaced with eight consolidated tracks:

- Software Engineering (SWE, full stack, frontend, backend, mobile, firmware, embedded — the old Frontend/Backend/Mobile tracks fold in here)
- Product & Program (Product Manager, APM, TPM, Program Manager, Scrum Master, Product Owner)
- Design & UX (UI/UX, UX Designer, Product Designer, UX Researcher, Interaction/Visual Designer)
- Data & Analytics (Data Analyst, BI, Analytics Engineer, Data Strategist, Tableau, Power BI — replaces "Data & AI", still catches ML/AI/data science)
- Cybersecurity (unchanged rules)
- Cloud & DevOps (renamed from Cloud/DevOps, same rules)
- Solutions & Sales Tech (Solutions/Sales Engineer, Solutions Architect, Technical Account Manager, Implementation Consultant)
- IT & Operations (IT Support, Help Desk, Sysadmin, Network Admin, Product Ops, BizOps, RevOps — renamed from IT/Systems)

Matching order runs specific tracks before the generic software match, title first then description, so a "Technical Product Manager" isn't swallowed by "Engineering". Experience-level and internship logic stays exactly as it is today. A backfill re-runs the trigger over every existing row so old track values are re-mapped immediately.

## 2. Ingestion feeder

`fetch-daily-jobs` currently makes one provider call for the title "Software Engineer", so non-SWE roles never enter the pipeline. It will loop over a set of query targets — Software Engineer, Software Engineer Intern, Product Manager, Product Manager Intern, UX Designer, Product Designer, Data Analyst, Business Intelligence Analyst, Solutions Engineer, Technical Account Manager, IT Support Specialist, Cybersecurity Analyst, DevOps Engineer, Cloud Engineer — with a smaller per-query limit, de-duplicating across all results before a single upsert.

The title relevance filter is broadened to accept product/program, design/UX, analytics, solutions, and IT/support keywords, and the exclusion list is tightened so "Solutions Engineer" and "Sales Engineer" are no longer dropped as sales roles. The quota fallback rows gain a Product, Design, and Solutions entry so the taxonomy is visible even when the provider is rate-limited.

## 3. `/jobs` track filters and badges

- Pills become: All tracks, Software Engineering, Product & Program, Design & UX, Data & Analytics, Cybersecurity, Cloud & DevOps, Solutions & Sales Tech, IT & Operations. Horizontally scrollable on mobile.
- Each track gets its own badge color from the design tokens (no hardcoded hex/utility colors) so domains are visually distinct at a glance.
- Track selection keeps filtering the already-loaded job list client-side rather than refetching per click — instant response, identical results, and it keeps the live "Internships & Early Career" count accurate. If you'd rather it be a server-side `.eq('track', …)` query per pill, say so and I'll switch it.

## 4. Save Jobs + Application Tracker

New `job_applications` table: `user_id`, `job_id`, `status` (saved / applied / interviewing / offered / rejected), `notes`, `applied_at`, plus timestamps, unique on `(user_id, job_id)`. RLS restricts every action to the row owner.

Job card actions:
- Bookmark icon toggles a `saved` row (filled when saved).
- "Apply Now" opens the listing in a new tab, then a dialog asks "Did you apply to [Company]?" with "Mark as Applied" (upserts `status = 'applied'`, sets `applied_at`) and "Just Browsing" (no write).

New segmented toggle beside the search controls: **Explore Jobs** / **My Tracker (X)**. My Tracker shows tracked jobs grouped in status tabs (Saved, Applied, Interviewing, Offered, Rejected) with counts; each entry lets you change status, edit notes, open the listing, or remove it.

## Technical notes

- Migration 1: `CREATE OR REPLACE FUNCTION public.normalize_job_classification()` with the new track CASE, then `UPDATE public.jobs SET title = title` to backfill through the trigger.
- Migration 2: `job_applications` table with GRANTs to `authenticated`/`service_role`, RLS enabled, one owner-scoped policy, `handle_updated_at` trigger, and indexes on `user_id` and `(user_id, status)`.
- New hook `src/hooks/useJobApplications.ts`: list, upsert-status, update-notes, delete; React Query key `["job-applications", userId]` with optimistic bookmark toggling.
- New components `src/components/jobs/ApplyConfirmDialog.tsx` and `src/components/jobs/TrackerBoard.tsx`; `src/pages/Jobs.tsx` gains the view toggle, new pill list, badge color map, and bookmark button.
- `supabase/functions/fetch-daily-jobs/index.ts`: query-target loop, widened keyword filter, extended fallback rows; conflict target stays `title,company`.
- Admin job forms keep using the legacy `career_level` enum; the trigger normalizes their input, so no admin UI change.
